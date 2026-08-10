# Insurance financial controls

The public contract represents money as integer minor units and keeps Benefit
authorization, Claim adjudication, remittance advice and settlement evidence as
separate state transitions.

## Claim arithmetic

Every adjudicated line satisfies:

```text
allowed = payer + patient_responsibility
billed = allowed + adjustment
```

Claim totals are exact sums of their lines. The payer amount determines the
decision:

| Condition | Decision |
| --- | --- |
| `payer = 0` | `denied` |
| `0 < payer < billed` | `partially_approved` |
| `payer = billed` | `approved` |

The API rejects negative amounts, unsafe integers, unbalanced lines and a
decision that disagrees with its amounts.

## Remittance and settlement

Remittance is payer advice. It records how the payer says an amount should be
allocated to adjudicated Claims. It does not prove that funds moved.

An authorized settlement source supplies independent evidence. Matching payer,
currency and amount evidence reconciles the remittance and posts the balanced
settlement ledger transaction. A variance remains an exception. A Claim reaches
`settled` only when cumulative matched settlement equals its approved payer
amount.

## Public executable example

[`fixtures/financial-controls.json`](./fixtures/financial-controls.json) contains
synthetic Claim, remittance and settlement records. Run:

```bash
npm ci
npm run test:financial-controls
```

The check independently recomputes line balances, Claim totals, the derived
decision, remittance allocation totals and settlement status. The main API
contract has additional authorization, idempotency, provenance and audit rules.

## Reproduce an as-of Claim view

[`fixtures/claim-valuation-timeline.json`](./fixtures/claim-valuation-timeline.json)
is a synthetic, bitemporal Claim history. Each event records when the fact became
effective and when the system recorded it. The executable check rejects future
knowledge, non-gapless sequences, unbalanced adjudication and an outstanding
amount that cannot be reproduced from payer liability and observed settlement.

This evidence supports development analysis for reported Claims. It does not
produce an actuarial reserve opinion or replace an insurer's IBNR, solvency,
capital or reinsurance models.

Read the complete [insurance integration guide](https://docs.heyrafiki.space/insurance/integration-guide)
and [financial control model](https://docs.heyrafiki.space/insurance/financial-controls).
