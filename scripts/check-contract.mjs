import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parse } from "yaml";

const source = await readFile(new URL("../openapi.yaml", import.meta.url), "utf8");
const spec = parse(source);

assert.equal(spec.openapi, "3.1.0");
assert.match(spec.info.version, /^\d+\.\d+\.\d+$/);
assert.deepEqual(spec.servers, [{ url: "https://api.heyrafiki.space/v1" }]);

const methods = new Set(["get", "post", "put", "patch", "delete"]);
const operations = Object.entries(spec.paths).flatMap(([path, pathItem]) =>
  Object.entries(pathItem)
    .filter(([method]) => methods.has(method))
    .map(([method, operation]) => ({ method, operation, path })),
);

assert.ok(operations.length >= 30, "The contract lost documented operations");

const operationIds = operations.map(({ operation }) => operation.operationId);
assert.ok(operationIds.every(Boolean), "Every operation needs an operationId");
assert.equal(new Set(operationIds).size, operationIds.length, "operationId values must be unique");

for (const { method, operation, path } of operations) {
  assert.ok(operation.responses?.["401"], `${method.toUpperCase()} ${path} needs a 401 response`);
  assert.ok(operation.responses?.["429"], `${method.toUpperCase()} ${path} needs a 429 response`);
}

const forbidden = [
  /\bconvex\b/i,
  /\bsupabase\b/i,
  /\bworkos\b/i,
  /\bpaystack\b/i,
  /\bdaily\b/i,
  /\bvercel\b/i,
  /\blocalhost\b/i,
  /\bstaging\b/i,
  /\b(?:TODO|FIXME)\b/,
];

for (const pattern of forbidden) assert.doesNotMatch(source, pattern);

console.log(`OpenAPI contract passed: ${operations.length} operations.`);
