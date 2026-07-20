# RELAY v1.7 Test Notes

## Automated release checks

The v1.7 release was checked for:

- Embedded browser JavaScript syntax through Node.
- Worker JavaScript syntax through Node.
- Duplicate HTML element IDs.
- Required controls and feature markers across all six workspaces.
- Absence of external browser runtime dependencies.
- Browser DOM initialization in headless Chromium.
- Navigation across Requests, Webhooks, Scenarios, Fixtures, Reports, and Interchange.
- Project report generation and HTML, Markdown, and evidence JSON downloads.
- cURL import.
- Postman Collection v2 import and v2.1 export.
- OpenAPI 3 JSON request generation.
- HAR import and export.
- Worker health, channel, webhook, event, authentication, deletion, fixture, and mock flows using an in-memory KV substitute.
- ZIP archive integrity after packaging.

Run the package verifier with:

```bash
python verify.py
```

## Request bench acceptance

1. Open `relay.html` and confirm the sample project appears.
2. Send **Get sample todo** and confirm a `200` JSON response.
3. Confirm both included assertions pass.
4. Add a failing assertion and confirm the result explains the actual value.
5. Save the response as a fixture.
6. Generate cURL, fetch, Python, and PowerShell code.
7. Save, duplicate, delete, and restore requests from History.
8. Export and re-import the project.
9. Confirm authentication values, secret variables, and sensitive headers are absent or redacted.

## Gateway acceptance

1. Deploy `gateway/worker.js` with a `RELAY_KV` binding.
2. Run the gateway diagnostic from Webhooks.
3. Create a webhook channel.
4. Deliver a POST request containing JSON to the displayed URL.
5. Refresh the inbox and inspect body, headers, source address, and query parameters.
6. Forward the event to a controlled endpoint.
7. Replay the event to the RELAY inbox.
8. Delete the remote event.
9. Enable proxy mode and test an API that blocks direct browser CORS requests.

## Signature acceptance

1. Deliver an event with a known HMAC signature.
2. Configure its header, secret, prefix, algorithm, and encoding.
3. Confirm RELAY reports a valid signature.
4. Change the secret and confirm verification fails.
5. Deliver the same signature twice and confirm duplicate detection.
6. Configure a timestamp header and confirm an out-of-tolerance event fails.

Use HTTPS so Web Crypto is available.

## Scenario acceptance

1. Create a scenario with a saved request.
2. Capture a JSON value as a runtime variable.
3. Reference it as `{{variableName}}` in a later request.
4. Add a webhook-wait step and deliver a matching event.
5. Confirm the match and captured values appear in the run log.
6. Add a delay step.
7. Confirm a failed assertion stops the scenario when configured to stop.
8. Confirm the same failure continues when configured to continue.
9. Press Stop during a webhook wait.

## Fixture and mock acceptance

1. Create a response fixture and sync it to the gateway.
2. Send the configured HTTP method to the public mock URL.
3. Confirm status, headers, content type, body, and delay.
4. Test server-error mode.
5. Test rate-limit mode and inspect `Retry-After`.
6. Test timeout mode.
7. Create a webhook fixture and emit it to the active inbox.
8. Select duplicate mode and confirm two deliveries.
9. Create a fixture assertion and confirm matching and differing responses are explained.

## Report and evidence acceptance

1. Open Reports and generate a Project Test Summary.
2. Enter prepared-by, reviewed-by, disposition, and unresolved-item values.
3. Confirm recent request and scenario status appears.
4. Generate a Request Evidence report and confirm assertions and the latest execution appear.
5. Generate a Scenario Run report and confirm the flow diagram and run log appear.
6. Select a webhook and generate a Webhook Delivery report.
7. Toggle bodies, headers, and recent history off and confirm they are omitted.
8. Export HTML, Markdown, and evidence JSON.
9. Use Print / Save PDF and confirm the browser print preview is clean.
10. Search exported files for known secret test values and confirm they are absent.

## Interchange acceptance

1. Import `examples/curl-example.txt` and confirm one POST request appears.
2. Import `examples/postman-example.json` and confirm its folder, request, and variable appear.
3. Import `examples/openapi-example.json` and confirm its operations become requests.
4. Confirm OpenAPI path variables are added to the active environment.
5. Import `examples/traffic-example.har` and confirm its entry becomes a request.
6. Export Postman and confirm query values, folders, and requests are retained.
7. Export HAR and confirm retained request history appears.
8. Confirm authentication secrets are blanked or redacted in both exports.
9. Select a webhook event and use **Copy selected webhook as request**.
10. Send the resulting request to a controlled endpoint.

## Expected constraints

- Direct browser mode remains subject to destination CORS rules.
- Web Crypto signature verification requires a secure browser context.
- Worker bodies are limited to 512 KiB.
- Workers KV is eventually consistent.
- OpenAPI YAML import focuses on server and operation discovery. Use JSON for detailed examples and schemas.
- Postman scripts, tests, file uploads, GraphQL bodies, and multipart form-data are not executed or translated in v1.7.
