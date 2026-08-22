# Heyrafiki Contract

The versioned REST contract for the Heyrafiki API.

## What this repository is for

If you are connecting to Heyrafiki, this is the source for its public API. It
defines the requests, responses and compatibility commitments that let an
integration work consistently across Care, Benefits, Claims and remittance.

It covers the technical details developers need: resources, authentication,
errors and idempotency. Clinical and Claim decisions remain with the people and
organizations responsible for them.

The contract is available for Sandbox integration. Version 1 accepts additive changes under the published compatibility policy.

The specification covers Practitioner discovery, Bookings, Sessions, Benefits,
Claims, remittance and Webhooks. Examples use synthetic data.

## Use the contract

- Read the [API documentation](https://docs.heyrafiki.space).
- Download [`openapi.yaml`](./openapi.yaml).
- Review the [insurance financial controls](./FINANCIAL_CONTROLS.md).
- Inspect the machine-readable [Assurance Graph](./ASSURANCE_GRAPH.md).
- Run the [Open Mental Health Insurance Assurance Benchmark](./BENCHMARK.md).
- Generate a client with any OpenAPI 3.1-compatible tool.
- Clone the contract or use `openapi.yaml` directly with an OpenAPI 3.1-compatible tool.

The API base URL is `https://api.heyrafiki.space/v1`.

## Validate a change

Requires Node.js 22 or newer.

```bash
npm ci
npm test
```

The checks validate the OpenAPI document, operation identifiers, authentication,
error coverage, public-information boundary, synthetic insurance amount
invariants, bitemporal Claim valuation and the control mapping for every
operation.

## Compatibility

Additive fields and operations do not change the major version. Breaking changes
use a new major API version and a documented migration period. See the
[versioning policy](https://docs.heyrafiki.space/versioning).

## Security

Report vulnerabilities through the
[Heyrafiki security policy](https://github.com/heyrafiki/.github/blob/main/SECURITY.md).
Never include personal, health or payment data in an issue or example.

## License

Licensed under the [Apache License 2.0](./LICENSE).
