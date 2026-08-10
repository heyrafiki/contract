import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { evaluateTimeline } from "./lib/valuation-rules.mjs";

const load = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
const baseline = await load("../fixtures/claim-valuation-timeline.json");
const manifest = await load("../benchmark/manifest.json");

const clone = (value) => structuredClone(value);
const valuation = evaluateTimeline(baseline);
assert.deepEqual(valuation, baseline.valuation);

const mutations = [
  {
    id: "duplicate-event",
    pattern: /unique/,
    mutate(timeline) {
      timeline.events[1].event_id = timeline.events[0].event_id;
    },
  },
  {
    id: "out-of-order-knowledge",
    pattern: /ordered/,
    mutate(timeline) {
      timeline.events[5].recorded_at = "2026-07-13T00:00:00.000Z";
      timeline.events[5].effective_at = "2026-07-13T00:00:00.000Z";
    },
  },
  {
    id: "future-knowledge",
    pattern: /future knowledge/,
    mutate(timeline) {
      timeline.events[6].recorded_at = "2026-08-02T08:11:40.000Z";
    },
  },
  {
    id: "unbalanced-adjudication",
    pattern: /balance/,
    mutate(timeline) {
      timeline.events[4].amounts.payer_liability += 1;
    },
  },
  {
    id: "over-settlement",
    pattern: /exceed payer liability/,
    mutate(timeline) {
      timeline.events[6].amounts.settled = 450001;
    },
  },
];

for (const scenario of mutations) {
  const timeline = clone(baseline);
  scenario.mutate(timeline);
  assert.throws(() => evaluateTimeline(timeline), scenario.pattern, scenario.id);
}

assert.deepEqual(manifest.reference_result, {
  status: "pass",
  positive_scenarios: manifest.suites.length,
  adversarial_scenarios_rejected: mutations.length,
  claim_events: baseline.events.length,
  payer_liability: valuation.payer_liability,
  observed_settlement: valuation.settled,
  outstanding: valuation.outstanding,
  currency: baseline.currency,
  minor_unit: baseline.minor_unit,
});

console.log(`Open assurance benchmark passed: ${manifest.suites.length} suites and ${mutations.length} adversarial mutations.`);
