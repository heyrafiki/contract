import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const timeline = JSON.parse(
  await readFile(new URL("../fixtures/claim-valuation-timeline.json", import.meta.url), "utf8"),
);
const schema = JSON.parse(
  await readFile(new URL("../assurance/claim-valuation-timeline.schema.json", import.meta.url), "utf8"),
);
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(schema);
assert.equal(validate(timeline), true, ajv.errorsText(validate.errors));

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

assert.deepEqual(timeline.valuation, {
  source_event_sequence: timeline.events.at(-1).sequence,
  claim_status: adjudication.next_status,
  financial_status: "partially_settled",
  billed: adjudication.amounts.billed,
  payer_liability: adjudication.amounts.payer_liability,
  patient_responsibility: adjudication.amounts.patient_responsibility,
  adjustment: adjudication.amounts.adjustment,
  remitted: latest("remittance_received", "remitted"),
  settled: latest("settlement_observed", "settled"),
  outstanding:
    adjudication.amounts.payer_liability - latest("settlement_observed", "settled"),
});

console.log("Claim valuation timeline passed: bitemporal order, balanced liability and as-of outstanding amount.");
