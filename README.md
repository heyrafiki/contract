# Heyrafiki OpenAPI

The versioned REST contract for the Heyrafiki API.

> Beta: the contract is available for sandbox integration and may receive additive changes before the first stable release.

The specification covers Practitioner discovery, Bookings, Sessions, Benefits,
Claims, remittance and Webhooks. Examples use synthetic data.

## Use the contract

- Read the [API documentation](https://docs.heyrafiki.space).
- Download [`openapi.yaml`](./openapi.yaml).
- Review the [insurance financial controls](./FINANCIAL_CONTROLS.md).
- Generate a client with any OpenAPI 3.1-compatible tool.
- Install the contract from npm with `npm install @heyrafiki/openapi@beta`.

The API base URL is `https://api.heyrafiki.space/v1`.

## Validate a change

Requires Node.js 22 or newer.

```bash
npm ci
npm test
```

The checks validate the OpenAPI document, operation identifiers, authentication,
error coverage, public-information boundary and synthetic insurance amount
invariants.

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
