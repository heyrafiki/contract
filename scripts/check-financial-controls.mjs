import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const fixture = JSON.parse(
  await readFile(
    new URL("../fixtures/financial-controls.json", import.meta.url),
    "utf8",
  ),
);

function amount(value, label) {
  assert.ok(
    Number.isSafeInteger(value) && value >= 0,
    `${label} must be a non-negative safe integer`,
  );
  return value;
}

function sum(values) {
  const total = values.reduce((current, value) => current + value, 0);
  assert.ok(Number.isSafeInteger(total), "Amount total exceeded the safe integer range");
  return total;
}

function decisionFor(payer, billed) {
  if (payer === 0) return "denied";
  if (payer === billed) return "approved";
  return "partially_approved";
}

const { claim, remittance, settlement_observation: settlement } = fixture;
assert.ok(claim.lines.length > 0, "A Claim needs at least one line");
assert.equal(
  new Set(claim.lines.map((line) => line.line_number)).size,
  claim.lines.length,
);

for (const line of claim.lines) {
  const billed = amount(line.amount.billed, `line ${line.line_number} billed`);
  const allowed = amount(line.amount.allowed, `line ${line.line_number} allowed`);
  const payer = amount(line.amount.payer, `line ${line.line_number} payer`);
  const patient = amount(
    line.amount.patient_responsibility,
    `line ${line.line_number} patient responsibility`,
  );
  const adjustment = amount(
    line.amount.adjustment,
    `line ${line.line_number} adjustment`,
  );
  assert.equal(allowed, payer + patient, `line ${line.line_number} allowed balance`);
  assert.equal(billed, allowed + adjustment, `line ${line.line_number} billed balance`);
}

assert.equal(
  claim.amount.billed,
  sum(claim.lines.map((line) => line.amount.billed)),
);
assert.equal(
  claim.amount.payer,
  sum(claim.lines.map((line) => line.amount.payer)),
);
assert.equal(
  claim.amount.patient_responsibility,
  sum(claim.lines.map((line) => line.amount.patient_responsibility)),
);
assert.equal(
  claim.amount.adjustment,
  sum(claim.lines.map((line) => line.amount.adjustment)),
);
assert.equal(claim.decision, decisionFor(claim.amount.payer, claim.amount.billed));

assert.equal(remittance.currency, claim.currency, "Remittance currency must match the Claim");
assert.equal(
  remittance.total_paid,
  sum(
    remittance.allocations.map((allocation) =>
      amount(allocation.paid_amount, "allocation"),
    ),
  ),
  "Remittance allocations must equal its advised total",
);
assert.ok(
  remittance.total_paid <= claim.amount.payer,
  "Remittance advice cannot exceed the approved payer amount",
);

const reconciliationStatus =
  settlement.currency === remittance.currency &&
  settlement.received_amount === remittance.total_paid
    ? "matched"
    : "variance";
assert.equal(reconciliationStatus, "matched");
assert.equal(claim.amount.payer - settlement.received_amount, 250000);

console.log(
  "Insurance financial controls passed: Claim, remittance and settlement balance.",
);
