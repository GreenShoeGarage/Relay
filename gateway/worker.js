const VERSION = '1.7.0';
const MAX_BODY_BYTES = 512 * 1024;
const DEFAULT_TTL_HOURS = 24;
const MAX_TTL_HOURS = 168;
const EVENT_LIMIT = 100;
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization,Content-Type,X-Relay-Channel',
  'Access-Control-Expose-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request, env, ctx) {
    try {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
      if (!env.RELAY_KV) return json({ error: 'RELAY_KV binding is not configured.' }, 503);
      const url = new URL(request.url);
      const parts = url.pathname.split('/').filter(Boolean);

      if (url.pathname === '/api/health' && request.method === 'GET') {
        return json({ ok: true, service: 'RELAY Gateway', version: VERSION, storage: 'Workers KV', now: new Date().toISOString() });
      }
      if (url.pathname === '/api/channels' && request.method === 'POST') return createChannel(request, env, url);
      if (parts[0] === 'hook' && parts[1]) return receiveWebhook(request, env, parts[1], url);
      if (parts[0] === 'mock' && parts[1] && parts[2]) return serveMock(request, env, parts[1], parts[2]);
      if (parts[0] === 'api' && parts[1] === 'proxy' && parts[2] && request.method === 'POST') return proxyRequest(request, env, parts[2]);
      if (parts[0] === 'api' && parts[1] === 'channels' && parts[2]) {
        const channelId = parts[2];
        const auth = await authorize(request, env, channelId);
        if (!auth.ok) return json({ error: auth.error }, auth.status);
        if (parts[3] === 'events' && !parts[4] && request.method === 'GET') return listEvents(env, channelId);
        if (parts[3] === 'events' && parts[4] && request.method === 'DELETE') return deleteEvent(env, channelId, parts[4]);
        if (parts[3] === 'replay' && request.method === 'POST') return replayEvent(request, env, channelId);
        if (parts[3] === 'mocks' && request.method === 'POST') return saveMock(request, env, channelId);
      }
      return json({ error: 'Route not found.' }, 404);
    } catch (error) {
      return json({ error: error?.message || 'Unexpected gateway error.' }, 500);
    }
  },
};

async function createChannel(request, env, url) {
  const input = await readJson(request, {});
  const ttlHours = clamp(Number(input.ttlHours || DEFAULT_TTL_HOURS), 1, MAX_TTL_HOURS);
  const ttlSeconds = Math.round(ttlHours * 3600);
  const id = randomToken(12);
  const token = randomToken(24);
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  const channel = { id, tokenHash: await sha256(token), createdAt: new Date().toISOString(), expiresAt, ttlSeconds };
  await env.RELAY_KV.put(channelKey(id), JSON.stringify(channel), { expirationTtl: ttlSeconds });
  return json({ id, token, expiresAt, hookUrl: `${url.origin}/hook/${id}` }, 201);
}

async function receiveWebhook(request, env, channelId, url) {
  const channel = await getChannel(env, channelId);
  if (!channel) return json({ error: 'Webhook channel not found or expired.' }, 404);
  const body = ['GET', 'HEAD'].includes(request.method) ? '' : await readLimitedText(request, MAX_BODY_BYTES);
  const id = randomToken(10);
  const receivedAt = new Date().toISOString();
  const event = {
    id,
    channelId,
    receivedAt,
    method: request.method,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams.entries()),
    headers: [...request.headers.entries()],
    body,
    sourceIp: request.headers.get('cf-connecting-ip') || '',
  };
  await env.RELAY_KV.put(eventKey(channelId, receivedAt, id), JSON.stringify(event), { expirationTtl: remainingTtl(channel) });
  return json({ accepted: true, eventId: id, receivedAt }, 202, { 'X-Relay-Event-Id': id });
}

async function listEvents(env, channelId) {
  const listed = await env.RELAY_KV.list({ prefix: `event:${channelId}:`, limit: EVENT_LIMIT });
  const values = await Promise.all(listed.keys.map(k => env.RELAY_KV.get(k.name, 'json')));
  const events = values.filter(Boolean).sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
  return json({ events, count: events.length, listComplete: listed.list_complete });
}

async function deleteEvent(env, channelId, eventId) {
  const key = await findEventKey(env, channelId, eventId);
  if (!key) return json({ error: 'Event not found.' }, 404);
  await env.RELAY_KV.delete(key);
  return json({ deleted: true, eventId });
}

async function replayEvent(request, env, channelId) {
  const input = await readJson(request);
  if (!input.eventId || !input.targetUrl) return json({ error: 'eventId and targetUrl are required.' }, 400);
  const target = validateTarget(input.targetUrl);
  const event = await getEvent(env, channelId, input.eventId);
  if (!event) return json({ error: 'Event not found.' }, 404);
  const headers = filteredHeaders(event.headers || []);
  const started = Date.now();
  const response = await fetch(target, {
    method: event.method,
    headers,
    body: ['GET', 'HEAD'].includes(event.method) ? undefined : event.body,
    redirect: 'manual',
  });
  return json({ status: response.status, statusText: response.statusText, durationMs: Date.now() - started, targetUrl: target.toString() });
}

async function proxyRequest(request, env, channelId) {
  const auth = await authorize(request, env, channelId);
  if (!auth.ok) return json({ error: auth.error }, auth.status);
  const input = await readJson(request);
  if (!input.url || !input.method) return json({ error: 'method and url are required.' }, 400);
  const target = validateTarget(input.url);
  const headers = filteredHeaders(input.headers || []);
  const started = Date.now();
  const response = await fetch(target, {
    method: String(input.method).toUpperCase(),
    headers,
    body: ['GET', 'HEAD'].includes(String(input.method).toUpperCase()) ? undefined : input.body ?? undefined,
    redirect: 'follow',
  });
  const body = await readLimitedText(response, MAX_BODY_BYTES);
  return json({
    status: response.status,
    statusText: response.statusText,
    headers: [...response.headers.entries()],
    body,
    url: response.url,
    redirected: response.redirected,
    durationMs: Date.now() - started,
  });
}

async function saveMock(request, env, channelId) {
  const input = await readJson(request);
  const fixture = sanitizeFixture(input.fixture);
  if (!fixture.id) return json({ error: 'Fixture id is required.' }, 400);
  const channel = await getChannel(env, channelId);
  const ttl = remainingTtl(channel);
  await env.RELAY_KV.put(mockKey(channelId, fixture.id), JSON.stringify(fixture), { expirationTtl: ttl });
  if (fixture.route) await env.RELAY_KV.put(mockRouteKey(channelId, fixture.route), JSON.stringify(fixture), { expirationTtl: ttl });
  return json({ saved: true, fixtureId: fixture.id, publicPath: `/mock/${channelId}/${encodeURIComponent(fixture.route || fixture.id)}` });
}

async function serveMock(request, env, channelId, fixtureId) {
  const channel = await getChannel(env, channelId);
  if (!channel) return json({ error: 'Mock channel not found or expired.' }, 404);
  const fixture = await env.RELAY_KV.get(mockKey(channelId, fixtureId), 'json') || await env.RELAY_KV.get(mockRouteKey(channelId, fixtureId), 'json');
  if (!fixture || !fixture.enabled) return json({ error: 'Mock fixture not found or disabled.' }, 404);
  if (fixture.method && fixture.method !== request.method) return json({ error: `This mock expects ${fixture.method}.` }, 405, { Allow: fixture.method });
  let delayMs = clamp(Number(fixture.delayMs || 0), 0, 25000);
  if (fixture.failureMode === 'timeout') delayMs = Math.max(delayMs, 15000);
  if (delayMs) await sleep(delayMs);
  if (fixture.failureMode === 'rate-limit') return new Response(JSON.stringify({ error: 'Simulated rate limit.' }), { status: 429, headers: withCors({ 'Content-Type': 'application/json', 'Retry-After': '30', 'X-Relay-Mock': 'rate-limit' }) });
  if (fixture.failureMode === 'error') return new Response(JSON.stringify({ error: 'Simulated upstream failure.' }), { status: 500, headers: withCors({ 'Content-Type': 'application/json', 'X-Relay-Mock': 'error' }) });
  const headers = parseFixtureHeaders(fixture.headersText);
  headers.set('Content-Type', fixture.contentType || headers.get('Content-Type') || 'text/plain;charset=UTF-8');
  headers.set('X-Relay-Mock', 'true');
  return new Response(['HEAD'].includes(request.method) ? null : fixture.body || '', { status: clamp(Number(fixture.status || 200), 100, 599), headers: withCors(headers) });
}

async function authorize(request, env, channelId) {
  const channel = await getChannel(env, channelId);
  if (!channel) return { ok: false, status: 404, error: 'Channel not found or expired.' };
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || !safeEqual(await sha256(token), channel.tokenHash)) return { ok: false, status: 401, error: 'Invalid channel token.' };
  return { ok: true, channel };
}

async function getChannel(env, id) { return env.RELAY_KV.get(channelKey(id), 'json'); }
async function getEvent(env, channelId, eventId) {
  const key = await findEventKey(env, channelId, eventId);
  return key ? env.RELAY_KV.get(key, 'json') : null;
}
async function findEventKey(env, channelId, eventId) {
  const listed = await env.RELAY_KV.list({ prefix: `event:${channelId}:`, limit: EVENT_LIMIT });
  return listed.keys.find(k => k.name.endsWith(`:${eventId}`))?.name || null;
}

function sanitizeFixture(input = {}) {
  return {
    id: String(input.id || '').slice(0, 100),
    name: String(input.name || 'Mock fixture').slice(0, 160),
    enabled: input.enabled !== false,
    type: input.type === 'webhook' ? 'webhook' : 'response',
    method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'].includes(input.method) ? input.method : 'GET',
    status: clamp(Number(input.status || 200), 100, 599),
    contentType: String(input.contentType || 'application/json').slice(0, 200),
    headersText: String(input.headersText || '{}').slice(0, 20000),
    body: String(input.body || '').slice(0, MAX_BODY_BYTES),
    delayMs: clamp(Number(input.delayMs || 0), 0, 25000),
    failureMode: ['none', 'error', 'rate-limit', 'timeout', 'duplicate'].includes(input.failureMode) ? input.failureMode : 'none',
    route: String(input.route || '').trim().replace(/[^a-zA-Z0-9._~-]+/g, '-').slice(0, 100),
  };
}

function parseFixtureHeaders(text) {
  try {
    const obj = JSON.parse(text || '{}');
    return new Headers(Object.entries(obj).map(([k, v]) => [k, String(v)]));
  } catch {
    return new Headers();
  }
}

function filteredHeaders(entries) {
  const blocked = /^(host|content-length|connection|cf-|x-forwarded-|x-real-ip)/i;
  return new Headers((entries || []).filter(([key]) => !blocked.test(String(key))));
}

function validateTarget(raw) {
  let url;
  try { url = new URL(raw); } catch { throw new Error('Target URL is invalid.'); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only HTTP and HTTPS targets are allowed.');
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host === '::1' || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) throw new Error('Private and local network targets are not allowed.');
  return url;
}

async function readJson(request, fallback) {
  try { return await request.json(); } catch (error) {
    if (arguments.length > 1) return fallback;
    throw new Error('Request body must contain valid JSON.');
  }
}
async function readLimitedText(message, limit) {
  const text = await message.text();
  if (new TextEncoder().encode(text).byteLength > limit) throw new Error(`Body exceeds ${limit} bytes.`);
  return text;
}
async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function safeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function randomToken(bytes) {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return [...data].map(b => b.toString(16).padStart(2, '0')).join('');
}
function remainingTtl(channel) { return Math.max(60, Math.floor((new Date(channel.expiresAt).getTime() - Date.now()) / 1000)); }
function channelKey(id) { return `channel:${id}`; }
function eventKey(channelId, receivedAt, id) { return `event:${channelId}:${receivedAt}:${id}`; }
function mockKey(channelId, fixtureId) { return `mock:${channelId}:${fixtureId}`; }
function mockRouteKey(channelId, route) { return `mockroute:${channelId}:${route}`; }
function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function withCors(headers = {}) {
  const h = headers instanceof Headers ? new Headers(headers) : new Headers(headers);
  for (const [k, v] of Object.entries(CORS)) h.set(k, v);
  return h;
}
function json(value, status = 200, headers = {}) {
  const h = withCors({ 'Content-Type': 'application/json;charset=UTF-8', ...headers });
  return new Response(JSON.stringify(value), { status, headers: h });
}
