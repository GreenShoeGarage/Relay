import worker from './worker.js';

class MemoryKV {
  constructor() { this.values = new Map(); }
  async put(key, value, options = {}) {
    this.values.set(key, { value, expires: options.expirationTtl ? Date.now() + options.expirationTtl * 1000 : null });
  }
  async get(key, type) {
    const entry = this.values.get(key);
    if (!entry) return null;
    if (entry.expires && entry.expires < Date.now()) { this.values.delete(key); return null; }
    return type === 'json' ? JSON.parse(entry.value) : entry.value;
  }
  async delete(key) { this.values.delete(key); }
  async list({ prefix = '', limit = 1000 } = {}) {
    const keys = [...this.values.keys()].filter(key => key.startsWith(prefix)).slice(0, limit).map(name => ({ name }));
    return { keys, list_complete: true };
  }
}

const env = { RELAY_KV: new MemoryKV() };
const call = (url, init = {}) => worker.fetch(new Request(url, init), env, {});
const read = async response => ({ response, data: await response.json() });

let result = await read(await call('https://relay.test/api/health'));
assert(result.response.status === 200 && result.data.version === '1.7.0', 'Health check failed');

result = await read(await call('https://relay.test/api/channels', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
}));
assert(result.response.status === 201 && result.data.id && result.data.token, 'Channel creation failed');
const channel = result.data;

result = await read(await call(channel.hookUrl, {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-test': 'yes' }, body: '{"type":"demo"}',
}));
assert(result.response.status === 202 && result.data.eventId, 'Webhook receipt failed');
const eventId = result.data.eventId;

result = await read(await call(`https://relay.test/api/channels/${channel.id}/events`, {
  headers: { authorization: `Bearer ${channel.token}` },
}));
assert(result.response.status === 200 && result.data.events.length === 1, 'Event listing failed');
assert(result.data.events[0].body === '{"type":"demo"}', 'Event body changed');

const fixture = {
  id: 'fixture-1', name: 'Healthy mock', enabled: true, type: 'response', method: 'GET', route: 'healthy',
  status: 201, contentType: 'application/json', headersText: '{"X-Test":"ok"}', body: '{"ok":true}',
  delayMs: 0, failureMode: 'none',
};
result = await read(await call(`https://relay.test/api/channels/${channel.id}/mocks`, {
  method: 'POST', headers: { authorization: `Bearer ${channel.token}`, 'content-type': 'application/json' },
  body: JSON.stringify({ fixture }),
}));
assert(result.response.status === 200 && result.data.publicPath.endsWith('/healthy'), 'Mock synchronization failed');

let response = await call(`https://relay.test/mock/${channel.id}/healthy`);
assert(response.status === 201 && response.headers.get('x-test') === 'ok', 'Mock response metadata failed');
assert(await response.text() === '{"ok":true}', 'Mock response body failed');

result = await read(await call(`https://relay.test/api/channels/${channel.id}/events/${eventId}`, {
  method: 'DELETE', headers: { authorization: `Bearer ${channel.token}` },
}));
assert(result.response.status === 200 && result.data.deleted, 'Event deletion failed');

response = await call(`https://relay.test/api/channels/${channel.id}/events`, {
  headers: { authorization: 'Bearer incorrect' },
});
assert(response.status === 401, 'Invalid token was accepted');

console.log('RELAY Gateway integration test passed');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
