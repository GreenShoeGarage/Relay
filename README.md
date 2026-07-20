# RELAY v2.0.0

RELAY is a local-first Field Instrument for testing and qualifying APIs and webhooks. It builds HTTP requests, inspects responses, receives webhook deliveries, verifies signatures, runs end-to-end scenarios, publishes mocks, validates contracts, compares environments, measures reliability, and produces release-readiness evidence.

The browser instrument is one self-contained HTML file with no runtime libraries. An optional Cloudflare Worker companion provides public webhook URLs, temporary event storage, CORS-safe proxying, forwarding, and mock endpoints.

## Quick start

### Browser-only API testing

Open `relay.html` in a modern browser or upload it to any static website. No build process, package manager, account, or external JavaScript library is required.

Direct requests remain subject to the destination API's CORS policy.

### Webhooks, proxying, and public mocks

Deploy `gateway/worker.js`, bind a Workers KV namespace as `RELAY_KV`, and enter the Worker URL under **Webhooks → RELAY Gateway**. See `DEPLOYMENT.md`.

## Instrument workflow

**Define → Send → Inspect → Receive → Replay → Verify → Qualify → Document → Exchange**

RELAY v2.0 has seven workspaces:

- **Requests** — construct requests, inspect responses, save collections, and define assertions.
- **Webhooks** — receive public deliveries, inspect metadata, verify HMAC signatures, replay, and forward.
- **Scenarios** — chain requests, delays, captured variables, and webhook expectations.
- **Qualification** — execute controlled test plans and determine release readiness.
- **Fixtures** — preserve baselines and publish configurable mock responses or webhook payloads.
- **Reports** — produce redacted evidence packages and sign-off records.
- **Interchange** — import cURL, Postman, OpenAPI/Swagger, and HAR; export Postman and HAR.

## v2.0 — API qualification

The Qualification workspace turns saved requests and scenarios into repeatable qualification plans.

### Data-driven execution

Provide a JSON array of data rows:

```json
[
  { "widgetId": "alpha", "expectedState": "ready" },
  { "widgetId": "beta", "expectedState": "paused" }
]
```

Each property becomes a runtime variable, so requests can use `{{widgetId}}` or `{{expectedState}}`. RELAY also exposes:

- `{{__row}}`
- `{{__iteration}}`
- `{{__environment}}`

A plan can run selected endpoints or one saved scenario across selected environments, rows, and repeated samples. Plans are capped at 200 executions to prevent accidental browser overload.

### Endpoint qualification profiles

Each saved request can define:

- Include/exclude from qualification
- Critical or noncritical release-gate status
- Allowed status codes, ranges, or classes such as `200`, `200-204`, and `2xx`
- Allowed response content types
- Maximum p95 latency
- Manual response JSON Schema
- Imported OpenAPI contract provenance

### Contract validation

RELAY validates response status, content type, assertions, and JSON structure. The built-in JSON Schema subset supports:

- `type`, including arrays of types
- `required` and `properties`
- `items`, `minItems`, `maxItems`, and `uniqueItems`
- `enum` and `const`
- `minimum`, `maximum`, `exclusiveMinimum`, and `exclusiveMaximum`
- `minLength`, `maxLength`, `pattern`, and basic `date-time` checks
- `additionalProperties: false`
- `allOf`, `anyOf`, `oneOf`, and `not`
- OpenAPI `nullable`

This validator is intended for practical browser-side qualification. It is not a complete implementation of every JSON Schema draft feature.

### OpenAPI response compliance

OpenAPI 3.x and Swagger 2.0 JSON import now retains:

- Response status definitions
- Declared response content types
- Response schemas
- Local `#/...` schema references
- Source title, path, method, and operation ID
- OpenAPI webhook request-body schemas

Imported contracts remain attached to the generated request and are visible in Qualification → Contracts. JSON import provides the highest fidelity. YAML import remains a conservative operation-discovery mode without an external YAML parser.

### Webhook schema compliance

Qualification → Webhooks can evaluate stored webhook events against:

- A manually entered JSON Schema, method, and path pattern
- An OpenAPI webhook contract imported through Interchange

Path patterns accept literal paths, `*`, and placeholders such as `/orders/{id}`. No configured webhook gate is treated as optional. A configured contract with no matching deliveries produces incomplete evidence rather than a false schema violation. Matching noncompliant deliveries are blocking findings.

### Performance sampling

RELAY reports:

- Median latency
- Overall and per-endpoint p95 latency
- Slowest sample
- Observed payload volume
- Per-endpoint configured p95 limits

Browser timing includes client-side networking and processing. It is useful for comparative qualification but is not a substitute for server-side load testing.

### Reliability and retry analysis

The runner can retry network failures, timeouts, HTTP `429`, and server errors. It records:

- Total attempts
- Retry attempts
- Recovered samples
- Exhausted failures
- Per-endpoint reliability gates
- Exponential retry backoff

Scenario qualification reuses the original response for JSON capture; it does not resend side-effecting request steps merely to capture a value.

### Environment comparison

Run the same plan against multiple RELAY environments. The comparison view shows:

- Sample count and success rate by environment
- p95 latency by environment
- Contract failures by environment
- Readiness disposition by environment
- Status-code parity
- JSON response-shape parity

### Endpoint qualification matrix

The matrix summarizes every endpoint/environment combination with:

- Samples passed and total
- Success rate
- Observed statuses
- Assertion failures
- Contract failures
- p95 latency
- Retry and recovery counts
- READY or HOLD disposition

### Release readiness

RELAY calculates a transparent disposition instead of compressing the evidence into one opaque score:

- **READY** — all configured gates pass.
- **CONDITIONAL** — noncritical failures or incomplete evidence remain.
- **NOT READY** — a critical endpoint gate or actual webhook schema gate fails.

The readiness view lists every gate, its result, its basis, and unresolved findings.

### Release-readiness reporting

Reports adds a **Release-readiness report** containing:

- Executive determination
- Gate-by-gate rationale
- Endpoint qualification matrix
- Environment comparison
- Retry recovery
- Unresolved contract, assertion, performance, reliability, parity, and webhook findings
- Prepared-by, reviewed-by, disposition, and notes fields

Use the browser print dialog to save the report as PDF, or export standalone HTML, Markdown, or structured evidence JSON.

## Existing capabilities

### Request bench

- GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS
- Query parameters and headers with enable controls
- Bearer Token, Basic Auth, and API Key authentication
- JSON, text, and URL-encoded request bodies
- Environment variables using `{{variableName}}`
- Pretty JSON, raw body, headers, safe HTML preview, generated code, history, folders, and saved requests
- cURL, JavaScript `fetch`, Python `requests`, and PowerShell generation
- Local autosave, project import/export, dark/light themes, and resizable panes

### Webhooks and signatures

- Temporary public webhook channels
- Incoming method, timestamp, source address, headers, query values, and body
- Replay, forwarding, remote deletion, local clearing, and polling
- HMAC SHA-256 and SHA-1 verification
- Hex/Base64 signatures, configurable prefixes, timestamp tolerance, and duplicate detection

### Scenarios

- Saved request steps
- JSON response capture into runtime variables
- Webhook waits and webhook payload capture
- Controlled delay steps
- Stop/continue-on-failure behavior
- Retained scenario run history

### Fixtures and mocks

- Response baselines and webhook fixtures
- Configurable status, headers, content type, body, method, route, and delay
- Server-error, rate-limit, timeout, and duplicate-delivery simulation
- Gateway synchronization and public mock URLs

### Reports and evidence

- Project test summary
- Request evidence report
- Scenario run report
- Webhook delivery report
- Release-readiness report
- Redacted HTML, Markdown, JSON, and print/PDF output

### Interchange

- cURL command import
- Postman Collection v2 import and redacted v2.1 export
- OpenAPI 3.x and Swagger 2.0 JSON import
- Conservative OpenAPI/Swagger YAML discovery
- HAR 1.2 import and redacted export
- Webhook-to-request conversion

## Local data and migration

Browser project data is stored under:

```text
relay-fi-v1
```

The storage key remains compatible with earlier releases. RELAY normalizes older projects and upgrades them to schema version 8 when saved.

The Worker stores channel metadata, events, and mock fixtures in `RELAY_KV`. Channel data expires with the channel.

## Security and redaction

RELAY masks or removes known sensitive values from project, report, evidence, Postman, HAR, webhook, fixture, history, and qualification exports, including:

- Secret environment values
- Bearer tokens
- Basic Auth passwords
- API Key values
- Gateway channel tokens
- Webhook signing secrets
- Common authentication, cookie, token, and API-key headers
- Known secret values found in URLs, bodies, notes, fixtures, events, qualification data sets, and retained evidence

Review exports before sharing. Domain payloads may contain sensitive values RELAY cannot infer.

Gateway proxy mode sends the resolved request through your Worker. Use it only with a Worker and KV namespace you control. The Worker rejects private and local network destinations.

## Browser constraints

- Direct requests require destination CORS permission.
- Browsers may hide protected response headers and cookies.
- Web Crypto signature verification requires HTTPS or another secure context.
- The gateway response body and stored webhook body are limited to 512 KiB.
- Workers KV is eventually consistent.
- Performance sampling is browser-oriented functional qualification, not high-concurrency load testing.
- Multipart form-data, file uploads, GraphQL-specific editors, Postman scripts/tests, and full JSON Schema vocabulary are not executed in v2.0.

## Keyboard shortcuts

- `Ctrl/Cmd + Enter` — send the current request
- `Ctrl/Cmd + S` — save the current request
- `Escape` — close menus and dialogs

## Package contents

```text
relay.html                              Complete single-file browser instrument
gateway/worker.js                       Cloudflare Worker gateway
gateway/wrangler.toml                   Worker and KV binding configuration
gateway/test-worker.mjs                 Worker integration test with in-memory KV
examples/qualification-openapi.json     OpenAPI response and webhook contract example
examples/qualification-dataset.json     Data-driven qualification rows
examples/curl-example.txt               cURL import example
examples/postman-example.json           Postman import example
examples/openapi-example.json           General OpenAPI import example
examples/traffic-example.har            HAR import example
README.md                               Product and operating guide
DEPLOYMENT.md                           Gateway deployment guide
TESTING.md                              Acceptance checklist
CHANGELOG.md                            Release history
verify.py                               Static and Worker release verifier
SHA256SUMS.txt                          Package checksums
```

## Verification

From the package directory:

```bash
python verify.py
```

The verifier checks embedded JavaScript syntax, Worker syntax, duplicate IDs, required controls, feature markers, external runtime dependencies, and the Worker integration flow.
