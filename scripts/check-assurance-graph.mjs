import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { parse } from "yaml";

const root = new URL("../", import.meta.url);
const graph = JSON.parse(await readFile(new URL("assurance/assurance-graph.json", root), "utf8"));
const graphSchema = JSON.parse(
  await readFile(new URL("assurance/assurance-graph.schema.json", root), "utf8"),
);
const contract = parse(await readFile(new URL(graph.contract.path, root), "utf8"));

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(graphSchema);
assert.equal(validate(graph), true, ajv.errorsText(validate.errors));

assert.equal(graph.schema_version, "1.0.0");
assert.equal(graph.contract.version, contract.info.version, "Graph and OpenAPI versions must match");

function uniqueById(items, label) {
  const ids = new Set();
  for (const item of items) {
    assert.match(item.id, /^[a-z0-9][a-z0-9._:-]+$/, `${label} ID is invalid`);
    assert.equal(ids.has(item.id), false, `${label} ID ${item.id} is duplicated`);
    ids.add(item.id);
  }
  return ids;
}

const sourceIds = uniqueById(graph.sources, "Source");
const evidenceIds = uniqueById(graph.evidence, "Evidence");
const controlIds = uniqueById(graph.controls, "Control");
uniqueById(graph.capabilities, "Capability");

for (const evidence of graph.evidence) await access(new URL(evidence.artifact, root));
for (const control of graph.controls) {
  assert.ok(control.source_ids.length > 0 && control.evidence_ids.length > 0);
  for (const id of control.source_ids) assert.ok(sourceIds.has(id), `Unknown source ${id}`);
  for (const id of control.evidence_ids) assert.ok(evidenceIds.has(id), `Unknown evidence ${id}`);
}

const documentedOperations = new Set();
for (const pathItem of Object.values(contract.paths ?? {})) {
  for (const method of ["get", "post", "put", "patch", "delete"]) {
    const operation = pathItem[method];
    if (operation?.operationId) documentedOperations.add(operation.operationId);
  }
}

const mappedOperations = new Set();
for (const capability of graph.capabilities) {
  assert.ok(capability.operations.length > 0 && capability.control_ids.length > 0);
  for (const id of capability.control_ids) assert.ok(controlIds.has(id), `Unknown control ${id}`);
  for (const operationId of capability.operations) {
    assert.ok(documentedOperations.has(operationId), `Unknown OpenAPI operation ${operationId}`);
    assert.equal(mappedOperations.has(operationId), false, `${operationId} is mapped more than once`);
    mappedOperations.add(operationId);
  }
}

assert.deepEqual(
  [...mappedOperations].sort(),
  [...documentedOperations].sort(),
  "Every public operation must have one accountable capability",
);

for (const required of [
  "control.claim_accountability",
  "control.financial_identity",
  "control.bitemporal_evidence",
  "control.credential_authority",
  "control.consent_and_purpose",
]) {
  assert.ok(controlIds.has(required), `Required institutional control ${required} is missing`);
}

console.log(`Assurance Graph passed: ${graph.capabilities.length} capabilities, ${documentedOperations.size} operations, ${graph.controls.length} controls.`);
