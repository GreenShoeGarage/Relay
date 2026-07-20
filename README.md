# RELAY v1.0.0

RELAY is a local-first Field Instrument for constructing, sending, inspecting, saving, and documenting HTTP API requests from a web browser.

## Run it

Open `relay.html` in a modern browser. No installation, build process, server, account, or external JavaScript library is required.

For the most predictable browser behavior, place `relay.html` on any ordinary static web host. It can also be opened directly from disk, although browser security behavior varies for local files.

## v1.0 capabilities

- GET, POST, PUT, PATCH, DELETE, HEAD, and OPTIONS requests
- Query parameter editor with enable and disable controls
- Request header editor
- No Auth, Bearer Token, Basic Auth, and API Key authentication
- JSON, plain text, and URL-encoded request bodies
- Environment variables using `{{variableName}}`
- Secret environment variables with masked editing
- Formatted JSON response view
- Raw response body, headers, and safe HTML preview
- Response status, duration, and payload size
- Saved request folders and browser-local request history
- Generated cURL, JavaScript fetch, Python requests, and PowerShell examples
- Project import and export as JSON
- Export-time redaction of environment and authentication secrets
- Local autosave indicator
- Resizable request and response work areas
- Dark and light modes
- Responsive narrow-screen layout
- Keyboard shortcuts

## Keyboard shortcuts

- `Ctrl/Cmd + Enter`: Send the current request
- `Ctrl/Cmd + S`: Save the current request
- `Escape`: Close menus and dialogs

## Browser limitations

RELAY v1.0 sends requests directly from the browser. The destination API must allow the request through CORS. Browser JavaScript also cannot expose every response header, manage protected cookies like a desktop API client, or receive public webhook calls directly.

A network error that says `Failed to fetch`, `Load failed`, or something similar often means the server rejected the browser request through CORS rather than that the API itself is offline.

RELAY v1.1 is intended to add an optional Cloudflare Worker gateway for:

- CORS-safe proxied requests
- Public webhook receiver channels
- Event inspection and replay
- Temporary event storage
- Request forwarding

## Storage and security

Project data is saved in the browser's local storage under the key `relay-fi-v1`.

Secret variables are masked in the environment editor. They remain stored locally so requests can be repeated. Project export clears secret environment values and direct Bearer, Basic Auth password, and API Key values. Review request bodies and ordinary headers before sharing exports because RELAY cannot determine whether every arbitrary value is sensitive.

Credentials are sent directly from the browser to the selected API in v1.0. RELAY does not transmit project data to its own service.

## Demo requests

The default project includes examples using JSONPlaceholder:

- `GET {{baseUrl}}/todos/1`
- `POST {{baseUrl}}/posts`

The demo environment defines:

```text
baseUrl = https://jsonplaceholder.typicode.com
```

Use the project menu and choose **Restore demo project** to return to the included examples.

## Project files

- `relay.html` — complete self-contained application
- `README.md` — usage and technical notes

## Version

FI-1XX · RELAY v1.0.0
