# RELAY Changelog

## v2.0.0 — API Qualification

- Added a dedicated Qualification workspace.
- Added endpoint-matrix and data-driven scenario qualification modes.
- Added JSON-array data sets with runtime variables for rows, iterations, and environments.
- Added endpoint qualification profiles with criticality, status rules, content-type rules, p95 limits, and manual response schemas.
- Added a practical browser-side JSON Schema validator.
- Added OpenAPI response-status, content-type, response-schema, local `$ref`, operation, and provenance retention.
- Added OpenAPI webhook contract import.
- Added stored webhook delivery schema compliance with method and path matching.
- Added repeated performance sampling with median, p95, maximum, and observed payload metrics.
- Added timeout, retry, exponential backoff, recovery, and exhausted-failure analysis.
- Added multi-environment qualification and response status/shape parity analysis.
- Added an endpoint qualification matrix with transparent per-gate results.
- Added READY, CONDITIONAL, and NOT READY release dispositions.
- Added a release-readiness report and qualification evidence JSON export.
- Added qualification history with up to 12 retained runs.
- Added migration to project schema version 8.
- Added qualification data-set redaction in project exports.
- Prevented scenario qualification capture from re-sending side-effecting request steps.
- Changed missing webhook evidence from a false violation to incomplete/conditional evidence.
- Updated the Cloudflare Worker and gateway test to v2.0.0.
- Added qualification OpenAPI and data-set examples.

## v1.7.0 — Interchange

- Added cURL, Postman Collection v2, OpenAPI/Swagger, and HAR import.
- Added redacted Postman Collection v2.1 and HAR export.
- Added selected-webhook conversion into a reusable request.

## v1.6.0 — Reports and Evidence

- Added project, request, scenario, and webhook reports.
- Added HTML, Markdown, evidence JSON, and print/PDF output.
- Added sign-off fields and expanded export redaction.

## v1.5.0 — Fixtures and Mocking

- Added response and webhook fixtures, public mocks, delays, errors, rate limits, timeouts, and duplicate delivery simulation.

## v1.4.0 — Scenario Runner

- Added chained request, webhook-wait, capture, delay, and control-flow steps.

## v1.3.0 — Signatures and Security

- Added HMAC verification, timestamp tolerance, duplicate detection, masking, and redaction.

## v1.2.0 — Assertions and Comparisons

- Added status, latency, header, JSON path, body, and fixture assertions.

## v1.1.0 — Webhook Gateway

- Added Cloudflare Worker webhook channels, event storage, replay, forwarding, proxying, and diagnostics.

## v1.0.0 — Request Bench

- Added the local-first request builder, response inspector, collections, environments, history, code generation, and project persistence.
