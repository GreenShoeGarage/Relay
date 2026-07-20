# RELAY v2.0 Test Notes

## Automated release checks

Run:

```bash
python verify.py
```

The release verifier checks:

- Embedded browser JavaScript syntax through Node.
- Cloudflare Worker JavaScript syntax through Node.
- Duplicate HTML element IDs.
- Required controls and feature markers across all seven workspaces.
- Absence of external browser runtime dependencies.
- Worker health, channel, webhook, event, authentication, deletion, fixture, and mock flows through an in-memory KV substitute.

The release build was also exercised in headless Chromium with deterministic in-page HTTP responses. The browser acceptance pass covered:

- Navigation through all seven workspaces.
- Endpoint-matrix qualification.
- Repeated sampling and execution counts.
- Manual schema failure and blocking disposition.
- Retry recovery and retry accounting.
- Data-driven scenario qualification.
- Verification that scenario response capture does not duplicate requests.
- OpenAPI response-schema and local-reference retention.
- OpenAPI webhook contract import.
- Qualification report generation.

## Qualification acceptance

### Endpoint matrix

1. Open Qualification.
2. Select one or more saved requests.
3. Select at least one environment.
4. Set Samples to `2` or more.
5. Run qualification.
6. Confirm the planned execution count equals requests × environments × rows × samples.
7. Confirm every endpoint/environment combination appears in the matrix.
8. Confirm status, assertion, contract, latency, retry, and disposition columns are populated.

### Data-driven rows

1. Import `examples/qualification-dataset.json` into the Data rows field.
2. Reference a row property from a saved request as `{{widgetId}}`.
3. Run qualification.
4. Confirm every row executes.
5. Add `{{__row}}`, `{{__iteration}}`, and `{{__environment}}` to controlled request headers and confirm substitution.
6. Enter invalid JSON and confirm RELAY prevents the run with an explanatory error.
7. Enter more than 200 planned executions and confirm RELAY blocks the plan.

### Manual contract

1. Open Qualification → Contracts.
2. Select a request.
3. Set allowed statuses and content types.
4. Enter a JSON Schema requiring a known response property.
5. Run against a compliant response and confirm Contract passes.
6. Require a missing property and confirm the matrix shows a contract failure.
7. Confirm a critical request produces NOT READY.
8. Mark the same request noncritical and confirm the disposition becomes CONDITIONAL.

### OpenAPI contract

1. Import `examples/qualification-openapi.json` through Interchange.
2. Open Qualification → Contracts.
3. Select **getWidget**.
4. Confirm source title, method, path, operation ID, and response `200` are shown.
5. Use **Load imported schema**.
6. Confirm the dereferenced Widget schema appears.
7. Run against a compliant endpoint and confirm schema compliance.
8. Remove a required field from the controlled response and confirm the failure identifies its JSON path.

### Webhook compliance

1. Import `examples/qualification-openapi.json`.
2. Open Qualification → Webhooks.
3. Select **widgetChanged**.
4. Deliver a matching compliant webhook and refresh the inbox.
5. Confirm the event passes.
6. Deliver a payload without `id` and confirm the event fails.
7. Confirm an actual noncompliant matching delivery is a blocking release finding.
8. Confirm a configured contract with no matching delivery is shown as incomplete evidence rather than as a schema violation.
9. Clear the custom schema and confirm the webhook gate becomes optional.

### Performance and reliability

1. Run at least five samples against a controlled endpoint.
2. Confirm median, p95, maximum, and payload totals are populated.
3. Set a p95 limit below the observed value and confirm the performance gate fails.
4. Configure a mock to return `500`, then recover.
5. Enable one retry and confirm attempts, retry count, and recovery are recorded.
6. Exhaust every retry and confirm the reliability gate fails.
7. Configure a timeout shorter than the mock delay and confirm a timeout finding.

### Environment comparison

1. Create two environments with different base URLs.
2. Select both for the same qualification plan.
3. Confirm each environment receives a summary row.
4. Return different status codes and confirm parity differs.
5. Return different JSON structures and confirm response-shape parity differs.
6. Confirm environment-specific p95 and readiness are shown.

### Scenario qualification

1. Create a scenario that sends one saved request and captures `$.id`.
2. Set Qualification mode to Data-driven scenario.
3. Run two samples.
4. Confirm the endpoint is sent exactly twice, not four times.
5. Use the captured variable in a later request.
6. Add a webhook-wait step and confirm the scenario can qualify the complete request-to-webhook flow.

### Release readiness and reports

1. Complete a passing plan and confirm READY.
2. Create a noncritical failure and confirm CONDITIONAL.
3. Create a critical contract, assertion, performance, or reliability failure and confirm NOT READY.
4. Open Readiness and inspect unresolved findings.
5. Use **Open readiness report**.
6. Confirm the executive determination, gates, endpoint matrix, environment comparison, and findings are included.
7. Export HTML, Markdown, evidence JSON, and print/PDF output.
8. Search exports for known secrets and confirm they are absent.

## Existing-workspace regression checklist

- Send the sample GET request and confirm both included assertions pass.
- Save, duplicate, delete, and restore requests.
- Generate cURL, fetch, Python, and PowerShell code.
- Create a gateway channel and inspect a delivered webhook.
- Verify a known HMAC signature and timestamp.
- Run a standard scenario outside qualification.
- Sync and exercise a mock fixture.
- Generate project, request, scenario, and webhook reports.
- Import cURL, Postman, OpenAPI, and HAR examples.
- Export Postman and HAR with secrets redacted.
- Export and re-import the RELAY project.

## Expected constraints

- Direct browser mode remains subject to destination CORS rules.
- Web Crypto requires a secure browser context.
- Worker bodies are limited to 512 KiB.
- Workers KV is eventually consistent.
- Performance sampling is not high-concurrency load testing.
- OpenAPI YAML mode focuses on operation discovery. Use JSON for response contracts and webhook schemas.
- The built-in schema validator implements a practical subset rather than every JSON Schema draft feature.
