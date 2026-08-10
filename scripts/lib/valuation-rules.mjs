import assert from "node:assert/strict";

export function evaluateTimeline(timeline) {
  assert.equal(timeline.schema_version, "1.0.0");
  assert.match(timeline.claim_id, /^clm_[A-Za-z0-9_-]+$/);
  assert.match(timeline.currency, /^[A-Z]{3}$/);
  assert.ok(Number.isInteger(timeline.minor_unit));
  assert.ok(timeline.service_period.starts_at < timeline.service_period.ends_at);

  const valuationAt = Date.parse(timeline.valuation_at);
  const eventIds = new Set();
  let previousRecordedAt = -Infinity;

  for (const [index, event] of timeline.events.entries()) {
    assert.equal(event.sequence, index + 1, "Event sequence must be gapless");
    assert.equal(eventIds.has(event.event_id), false, "Event IDs must be unique");
    eventIds.add(event.event_id);

    const effectiveAt = Date.parse(event.effective_at);
    const recordedAt = Date.parse(event.recorded_at);
    assert.ok(Number.isFinite(effectiveAt) && Number.isFinite(recordedAt));
    assert.ok(effectiveAt <= recordedAt, "A fact cannot be recorded before it became effective");
    assert.ok(recordedAt >= previousRecordedAt, "Events must be ordered by recorded time");
    assert.ok(recordedAt <= valuationAt, "The as-of valuation cannot use future knowledge");
    previousRecordedAt = recordedAt;

    for (const amount of Object.values(event.amounts ?? {})) {
      assert.ok(Number.isSafeInteger(amount) && amount >= 0, "Money uses non-negative integer minor units");
    }
  }

  const adjudication = timeline.events.find((event) => event.event_type === "claim_adjudicated");
  assert.ok(adjudication, "A valuation-ready Claim needs an adjudication event");
  assert.equal(
    adjudication.amounts.billed,
    adjudication.amounts.payer_liability +
      adjudication.amounts.patient_responsibility +
      adjudication.amounts.adjustment,
    "Adjudication must balance",
  );

  const latest = (type, field) =>
    [...timeline.events]
      .reverse()
      .find((event) => event.event_type === type)?.amounts?.[field] ?? 0;
  const settled = latest("settlement_observed", "settled");
  const payerLiability = adjudication.amounts.payer_liability;
  assert.ok(settled <= payerLiability, "Observed settlement cannot exceed payer liability");

  return {
    source_event_sequence: timeline.events.at(-1).sequence,
    claim_status: adjudication.next_status,
    financial_status:
      settled === 0 ? "remitted" : settled < payerLiability ? "partially_settled" : "settled",
    billed: adjudication.amounts.billed,
    payer_liability: payerLiability,
    patient_responsibility: adjudication.amounts.patient_responsibility,
    adjustment: adjudication.amounts.adjustment,
    remitted: latest("remittance_received", "remitted"),
    settled,
    outstanding: payerLiability - settled,
  };
}
