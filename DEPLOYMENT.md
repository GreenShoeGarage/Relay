# RELAY Gateway Deployment

RELAY's browser instrument works without a server for APIs that allow browser CORS requests. Deploy the optional Cloudflare Worker when you need public webhook endpoints, temporary event storage, CORS-safe proxying, forwarding, or public mocks.

## Requirements

- A Cloudflare account
- A Workers KV namespace
- The files in `gateway/`

The Worker expects a KV binding named exactly:

```text
RELAY_KV
```

## Wrangler deployment

### Simplest deployment

The included `wrangler.toml` declares the `RELAY_KV` binding without an ID. Current Wrangler releases can provision the resource during deployment and write the generated ID back to the configuration.

From the `gateway` folder:

```bash
npx wrangler deploy
```

### Bind an existing namespace

To create and bind the namespace explicitly:

```bash
npx wrangler kv namespace create RELAY_KV
```

Copy the returned ID into `gateway/wrangler.toml`:

```toml
name = "relay-gateway"
main = "worker.js"
compatibility_date = "2026-07-19"

[[kv_namespaces]]
binding = "RELAY_KV"
id = "YOUR_NAMESPACE_ID"
```

Then deploy:

```bash
npx wrangler deploy
```

After deployment:

1. Copy the resulting Worker URL.
2. Open RELAY → Webhooks.
3. Paste the URL into **Worker base URL**.
4. Run **Diagnose**.
5. Create a channel.

## Dashboard deployment

You may also create a Worker in the Cloudflare dashboard, paste `worker.js`, create a Workers KV namespace, and bind it as `RELAY_KV` under the Worker's bindings.

## Gateway routes

- `GET /api/health` — health and version
- `POST /api/channels` — create an expiring channel
- `/hook/{channelId}` — public inbound webhook endpoint
- `GET /api/channels/{channelId}/events` — authenticated event list
- `DELETE /api/channels/{channelId}/events/{eventId}` — authenticated deletion
- `POST /api/channels/{channelId}/replay` — authenticated replay/forward
- `POST /api/channels/{channelId}/mocks` — authenticated mock synchronization
- `/mock/{channelId}/{fixtureIdOrRoute}` — public mock endpoint
- `POST /api/proxy/{channelId}` — authenticated CORS proxy

Private gateway operations require the generated Bearer token. Public hook and mock URLs are intentionally unauthenticated.

## Security notes

- Deploy and use only a Worker and KV namespace you control.
- Gateway proxy mode can receive resolved API URLs, headers, credentials, and request bodies.
- The Worker rejects localhost, loopback, link-local, and RFC1918 private-network targets.
- Channel tokens are stored only as SHA-256 hashes in KV.
- Channels expire after their configured TTL.
- Event and response bodies are limited to 512 KiB.
- Review Cloudflare account access, logs, retention, and jurisdiction requirements before using production secrets or regulated data.

## Test the Worker locally

The package includes an in-memory integration test:

```bash
node test-worker.mjs
```

It verifies health, channel creation, webhook receipt, event listing, mock publishing, mock delivery, event deletion, and invalid-token rejection.
