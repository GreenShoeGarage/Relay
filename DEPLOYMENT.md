# RELAY Gateway Deployment

The RELAY Gateway is an optional Cloudflare Worker. It provides public webhook channels, temporary event storage, CORS-safe API proxying, event forwarding, and mock endpoints.

## Required binding

The Worker expects one Workers KV binding:

```text
Binding name: RELAY_KV
```

The binding name must match exactly because `worker.js` reads `env.RELAY_KV`.

## Dashboard deployment

1. Sign in to the Cloudflare dashboard.
2. Open **Workers & Pages** and create a Worker.
3. Replace the generated Worker code with `gateway/worker.js`.
4. Open the Worker’s **Settings → Bindings** area.
5. Add a **KV namespace** binding named `RELAY_KV`.
6. Create or select a KV namespace for RELAY.
7. Deploy the Worker.
8. Copy the Worker base URL, such as `https://relay-gateway.example.workers.dev`.
9. Open RELAY and go to **Webhooks**.
10. Paste the base URL into **Worker base URL** and press **Run diagnostics**.
11. Press **Create channel**.

## Wrangler deployment

The included `wrangler.toml` declares the Worker and KV binding:

```toml
name = "relay-gateway"
main = "worker.js"
compatibility_date = "2026-07-19"

[[kv_namespaces]]
binding = "RELAY_KV"
```

From the `gateway` folder:

```bash
npx wrangler deploy
```

Recent Wrangler versions can create the declared resource when the binding has no namespace ID. You may instead add an existing namespace ID or configure the binding through the Cloudflare dashboard.

## Health check

Open this route on the deployed Worker:

```text
/api/health
```

A configured gateway returns JSON similar to:

```json
{
  "ok": true,
  "service": "RELAY Gateway",
  "version": "1.7.0",
  "storage": "Workers KV"
}
```

When the KV binding is absent, the gateway returns a `503` response explaining that `RELAY_KV` is not configured.

## Gateway routes

| Route | Purpose | Access |
|---|---|---|
| `GET /api/health` | Health and version information | Public |
| `POST /api/channels` | Create a temporary channel | Public |
| `ANY /hook/:channelId` | Receive a webhook delivery | Public |
| `GET /api/channels/:id/events` | List channel events | Bearer channel token |
| `DELETE /api/channels/:id/events/:eventId` | Delete an event | Bearer channel token |
| `POST /api/channels/:id/replay` | Forward a stored event | Bearer channel token |
| `POST /api/proxy/:channelId` | Proxy an API request | Bearer channel token |
| `POST /api/channels/:id/mocks` | Save a mock fixture | Bearer channel token |
| `ANY /mock/:channelId/:route` | Return a mock response | Public |

## Security notes

- Channel IDs and management tokens are generated with cryptographic randomness.
- Only a SHA-256 hash of the channel token is stored in KV.
- Webhook and mock URLs are public by design.
- Event listing, deletion, replay, proxying, and mock management require the channel token.
- The gateway refuses HTTP targets on localhost and common private-network ranges.
- Channel metadata, events, and mocks expire with the channel.
- The default channel lifetime is 24 hours. The Worker accepts one to 168 hours through its API.
- Gateway proxy mode carries API credentials through the Worker. Deploy and use only a Worker you control.

## Static-site deployment

`relay.html` can be uploaded unchanged to a normal static website. The browser instrument and Worker do not need to share a domain because the Worker returns permissive CORS headers for RELAY operations.
