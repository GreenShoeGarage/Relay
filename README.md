# RELAY v1.7.0

RELAY is a local-first Field Instrument for testing APIs and webhooks. It constructs and sends HTTP requests, inspects responses, receives and verifies webhook deliveries, runs end-to-end scenarios, publishes mock endpoints, generates test evidence, and imports or exports common API-tool formats.

The browser instrument is one self-contained HTML file with no runtime libraries. An optional Cloudflare Worker companion provides public webhook URLs, temporary event storage, CORS-safe request proxying, forwarding, and public mock endpoints.

## Quick start

### Request testing only

Open `relay.html` in a modern browser or upload it to any static website. No account, build process, package manager, or external JavaScript library is required.

### Webhooks, proxying, and mocks

Deploy the files in `gateway/`, bind a Workers KV namespace as `RELAY_KV`, and paste the Worker URL into **Webhooks → RELAY Gateway**. See `DEPLOYMENT.md`.

## Instrument workflow

**Define → Send → Inspect → Receive → Replay → Verify → Document → Exchange**

RELAY v1.7 has six workspaces:

- **Requests** — construct requests, inspect responses, save collections, and define assertions.
- **Webhooks** — receive public deliveries, inspect metadata, verify HMAC signatures, replay, and forward.
- **Scenarios** — chain requests, delays, captured variables, and webhook expectations.
- **Fixtures** — preserve baselines and publish configurable mock responses or webhook payloads.
- **Reports** — produce redacted test summaries, evidence packages, diagrams, and sign-off records.
- **Interchange** — import cURL, Postman, OpenAPI/Swagger, and HAR; export Postman and HAR.

## Request bench

- GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS
- Query parameters and headers with enable controls
- No Auth, Bearer Token, Basic Auth, and API Key authentication
- JSON, text, and URL-encoded request bodies
- Environment variables using `{{variableName}}`
- Secret environment variables with masked editing
- Pretty JSON, raw body, response headers, safe HTML preview, and generated code
- Status, response time, payload size, redirect status, history, folders, and saved requests
- Generated cURL, JavaScript `fetch`, Python `requests`, and PowerShell
- Local autosave, project import/export, dark/light themes, and resizable panes

## v1.1 — Webhook gateway

- Public webhook channels with a 24-hour default expiration
- Incoming method, time, source address, headers, query values, and body
- Manual refresh or three-second polling
- Webhook replay, forwarding, remote deletion, and local clearing
- Gateway health diagnostics
- Optional CORS-safe API request proxy
- Channel-token authentication for private gateway operations

The public hook URL is intentionally unauthenticated so third-party systems can deliver to it. Event listing, deletion, replay, proxying, and mock management require the generated channel token.

## v1.2 — Assertions and comparisons

Requests can contain visual assertions without custom scripts:

- Status equality or inequality
- Response-time thresholds
- Header existence, equality, or containment
- JSON path existence or equality
- Body text containment
- Response comparison with a saved fixture

Supported JSON path syntax is intentionally compact, for example:

```text
$.data.id
$.items[0].status
```

## v1.3 — Signatures and security

- HMAC SHA-256 and SHA-1 verification through Web Crypto
- Hex and Base64 signature encodings
- Configurable signature header and prefix
- Timestamp-header tolerance
- Duplicate-signature detection
- Masked signing-secret entry
- Secret and sensitive-header redaction in project, report, evidence, Postman, and HAR exports
- Confirmation before gateway proxy mode is enabled

Signature verification requires a secure browser context such as HTTPS.

## v1.4 — Scenario runner

Scenario steps may:

1. Send a saved request.
2. Evaluate the request’s assertions.
3. Capture a JSON response value as a runtime variable.
4. Use the value in later requests as `{{variableName}}`.
5. Wait for a matching webhook event.
6. Capture a value from the webhook payload.
7. Insert a controlled delay.
8. Stop or continue after a failed request.

Each scenario retains its 20 most recent run records.

## v1.5 — Fixtures and mocking

- Response baselines and webhook fixtures
- Custom status, content type, headers, body, HTTP method, route, and delay
- Simulated server errors
- Simulated `429` rate limiting with `Retry-After`
- Simulated timeout behavior
- Duplicate webhook emission
- Gateway synchronization and public mock URLs

## v1.6 — Reports and evidence

The Reports workspace creates four report types:

- Project test summary
- Request evidence report
- Scenario run report
- Webhook delivery report

Report features include:

- Executive result and qualification statistics
- Request, response, webhook, assertion, and scenario evidence
- Scenario-flow diagrams
- Failure summaries
- Prepared-by, reviewed-by, disposition, and unresolved-item fields
- Optional body, header, and recent-history inclusion
- Standalone HTML export
- Markdown export
- Structured RELAY evidence JSON
- Print-ready output through **Print / Save PDF**

Print/PDF uses the browser’s native print dialog. Choose **Save as PDF** to create a PDF without adding a large PDF library to the standalone instrument.

## v1.7 — Interchange

### cURL import

Recognizes common cURL syntax including:

- `-X` / `--request`
- `-H` / `--header`
- `-d`, `--data`, `--data-raw`, and related data flags
- `-u` / `--user`
- `-G` / `--get`
- `-I` / `--head`
- `--url`
- Cookie headers
- Common compact flags such as `-XPOST` and `-HContent-Type:...`

### Postman Collection v2 import/export

Imports:

- Nested folders
- Requests and query values
- Headers
- Raw and URL-encoded bodies
- Bearer, Basic, and API Key authentication
- Collection variables

Exports saved RELAY requests as Postman Collection v2.1. Authentication secrets and secret environment values are blanked.

### OpenAPI and Swagger import

OpenAPI 3.x and Swagger 2.0 JSON import supports:

- Server URL, host, scheme, and base path
- Operations and tags
- Path, query, and header parameters
- Parameter examples and defaults
- JSON request-body examples
- Simple sample bodies generated from schemas
- Server and path variables converted to RELAY environment variables

Common YAML layouts are also recognized without an external YAML dependency. YAML mode focuses on server and operation discovery; JSON preserves more examples and schema detail.

### HAR import/export

HAR 1.2 import converts captured entries into saved requests. HAR export converts RELAY request history into a portable traffic archive with sensitive values redacted.

### Webhook-to-request conversion

A selected inbound webhook can be copied into the Requests workspace as a saved replay request, including its method, payload, query values, and permitted headers.

## Gateway proxy warning

Direct mode sends credentials from the browser straight to the selected API. Gateway proxy mode sends the resolved URL, headers, authentication values, and body through the configured Cloudflare Worker.

Use proxy mode only with a Worker and KV namespace you control.

## Local data

The browser instrument stores project data under:

```text
relay-fi-v1
```

The storage key remains compatible with earlier releases. RELAY normalizes older projects and updates them to schema version 7 when saved.

The Worker stores channel metadata, events, and mock fixtures in the bound `RELAY_KV` namespace. Channel data expires with the channel.

## Export redaction

RELAY removes or redacts:

- Secret environment-variable values
- Bearer tokens
- Basic Auth passwords
- API Key values
- Gateway channel tokens
- Webhook signing secrets
- Common authentication, cookie, token, and API-key headers
- Known stored secret values found in exported bodies, URLs, notes, history, fixtures, and event data

Domain payloads can still contain sensitive values RELAY does not recognize. Review evidence before sharing it.

## Browser constraints

- Without the gateway, destination APIs must permit browser-origin requests through CORS.
- Browsers may hide protected response headers and cookies.
- Web Crypto signature verification requires HTTPS or another secure browser context.
- The gateway response body and stored webhook body are limited to 512 KiB.
- Workers KV is eventually consistent, so a new event may occasionally appear on the next poll.
- OpenAPI YAML import is intentionally conservative; use JSON for highest-fidelity translation.

## Keyboard shortcuts

- `Ctrl/Cmd + Enter` — send the current request
- `Ctrl/Cmd + S` — save the current request
- `Escape` — close menus and dialogs

## Package contents

```text
relay.html                       Complete single-file browser instrument
gateway/worker.js                Cloudflare Worker gateway
gateway/wrangler.toml            Worker and KV binding configuration
gateway/test-worker.mjs          Worker integration test with in-memory KV
examples/curl-example.txt        Example cURL import
examples/openapi-example.json    Example OpenAPI import
examples/postman-example.json    Example Postman import
examples/traffic-example.har     Example HAR import
README.md                        Feature and operating guide
DEPLOYMENT.md                    Gateway deployment instructions
TESTING.md                       Acceptance and verification checklist
CHANGELOG.md                     Release history
verify.py                        Static and Worker package verification
```

## Verification

With Node installed:

```bash
python verify.py
```

The script checks HTML structure, unique element IDs, required feature markers, external runtime dependencies, browser JavaScript syntax, Worker JavaScript syntax, and the Worker integration suite.

## Version

FI-1XX · RELAY v1.7.0
