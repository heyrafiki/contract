import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { evaluateTimeline } from "./lib/valuation-rules.mjs";

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
assert.deepEqual(timeline.valuation, evaluateTimeline(timeline));

console.log("Claim valuation timeline passed: bitemporal order, balanced liability and as-of outstanding amount.");
