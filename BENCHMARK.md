# Open Mental Health Insurance Assurance Benchmark

This benchmark tests whether a mental-health insurance integration preserves the boundaries needed for safe technical due diligence: typed authority, deterministic retries, balanced Claim decisions, separate remittance and settlement evidence, bitemporal history and a reproducible as-of outstanding amount.

Version `0.1.1` uses synthetic data and an Apache-2.0 licensed test harness. It is open for insurer, regulator, government, actuarial, research and engineering review.

## Reference result

| Measure | Result |
| --- | ---: |
| Public OpenAPI operations mapped | 31 |
| Accountable capabilities | 10 |
| Named controls | 9 |
| Benchmark suites | 4 |
| Adversarial mutations rejected | 5 of 5 |
| Synthetic Claim events | 7 |
| Payer liability | KES 4,500.00 |
| Observed settlement | KES 3,500.00 |
| Reproducible outstanding | KES 1,000.00 |

The adversarial suite rejects duplicate events, out-of-order knowledge, future knowledge at the valuation cutoff, unbalanced adjudication and settlement above payer liability.

## Run it

```bash
git clone https://github.com/heyrafiki/openapi.git
cd openapi
npm ci
npm run benchmark
```

The benchmark manifest lives at [`benchmark/manifest.json`](./benchmark/manifest.json). The input Claim is [`fixtures/claim-valuation-timeline.json`](./fixtures/claim-valuation-timeline.json). Both validate against published JSON Schema before their financial assertions run.

## Contribute a scenario

A proposed scenario needs:

1. synthetic or explicitly approved data;
2. a stated authority and purpose boundary;
3. versioned inputs and expected outputs;
4. at least one negative or adversarial case;
5. a deterministic verification command;
6. no Person identity, clinical content or payment credentials.

Use a pull request so the scenario, assumptions and review history remain public. A named institutional or research collaboration is credited only after all parties approve the wording.

## Research boundary

The benchmark is a conformance baseline, not a claim of clinical efficacy, production performance, regulatory approval or actuarial reserve adequacy. It creates a reproducible surface for comparing integration controls and testing research hypotheses. New mathematical or actuarial claims require a formal problem, baselines, evaluation data, results and expert review.
