# RELAY Changelog

## v1.7.0 — Interchange

- Added a dedicated Interchange workspace.
- Added cURL command import with common short, long, and compact flags.
- Added Postman Collection v2 import with nested folders, variables, auth, query values, headers, and bodies.
- Added redacted Postman Collection v2.1 export.
- Added OpenAPI 3.x and Swagger 2.0 JSON request generation.
- Added conservative OpenAPI/Swagger YAML operation discovery.
- Added HAR 1.2 import and redacted request-history export.
- Added selected-webhook conversion into a reusable saved request.
- Added import summaries, warnings, import folders, and sample interchange files.

## v1.6.0 — Reports and Evidence

- Added a dedicated Reports workspace.
- Added project, request, scenario, and webhook report types.
- Added executive result cards, evidence tables, scenario-flow diagrams, and failure summaries.
- Added prepared-by, reviewed-by, disposition, and unresolved-item fields.
- Added configurable body, header, and request-history inclusion.
- Added standalone HTML, Markdown, and structured evidence JSON exports.
- Added print-ready report output for browser Save as PDF.
- Expanded credential, secret, header, payload, fixture, history, and note redaction.

## v1.5.0 — Fixtures and Mocking

- Added response and webhook fixtures.
- Added save-response and save-webhook fixture actions.
- Added baseline fixture comparisons in assertions.
- Added gateway-backed public mock endpoints.
- Added custom status, headers, body, content type, method, route, and delay controls.
- Added server-error, rate-limit, timeout, and duplicate-webhook simulation.
- Added fixture duplication, testing, synchronization, and local persistence.

## v1.4.0 — Scenario Runner

- Added request, webhook-wait, and delay steps.
- Added response and webhook value capture.
- Added runtime variables for later scenario steps.
- Added assertion execution inside scenarios.
- Added stop/continue behavior and run logs.
- Added per-scenario run history.

## v1.3.0 — Signatures and Security

- Added HMAC SHA-256 and SHA-1 verification.
- Added hex and Base64 encodings, prefixes, timestamp tolerance, and duplicate detection.
- Added masked signing-secret controls.
- Added history sanitization and expanded export redaction.
- Added confirmation before gateway proxy mode is enabled.

## v1.2.0 — Assertions and Comparisons

- Added visual response assertions.
- Added status, timing, header, JSON path, body, and fixture checks.
- Added explainable pass/fail results.
- Added response-to-fixture comparison.

## v1.1.0 — Webhook Gateway

- Added Cloudflare Worker companion.
- Added temporary public webhook channels.
- Added event polling, inspection, replay, forwarding, and deletion.
- Added gateway diagnostics and optional CORS-safe request proxying.
- Added Workers KV persistence and expiration.

## v1.0.0 — Request Bench

- Initial local-first API request and response instrument.
