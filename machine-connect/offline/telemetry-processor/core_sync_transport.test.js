const test = require('node:test');
const assert = require('node:assert/strict');
const { createCoreSyncTransport } = require('./core_sync_transport');

test('Core transport sends machine credential and requires explicit confirmation', async () => {
  let request;
  const transport = createCoreSyncTransport({ coreUrl: 'https://core.example', machineId: 'machine-1', credential: 'mc_test', fetchImpl: async (url, init) => {
    request = { url, init };
    return new Response(JSON.stringify({ confirmed: true, items: [{ queue_id: '1', idempotency_key: 'offline-sync:1', confirmed: true, record_id: 'r1' }] }), { status: 200, headers: { 'content-type': 'application/json' } });
  }});
  const result = await transport.pushTelemetry([{ queue_id: '1', idempotency_key: 'offline-sync:1', operation: 'insert', table_name: 'telemetry', data: {}, observed_at: new Date().toISOString() }]);
  assert.equal(result.confirmed, true);
  assert.equal(request.init.headers['x-machine-credential'], 'mc_test');
  assert.match(request.url, /\/api\/machines\/machine-1\/sync\/telemetry$/);
});

test('Core transport refuses an ambiguous success response', async () => {
  const transport = createCoreSyncTransport({ coreUrl: 'https://core.example', machineId: 'machine-1', credential: 'mc_test', fetchImpl: async () => new Response(JSON.stringify({ ok: true }), { status: 200 }) });
  const result = await transport.pushTelemetry([]);
  assert.equal(result.confirmed, false);
});

test('Core transport classifies 4xx as rejected', async () => {
  const transport = createCoreSyncTransport({ coreUrl: 'https://core.example', machineId: 'machine-1', credential: 'mc_test', fetchImpl: async () => new Response('', { status: 401 }) });
  const result = await transport.pushTelemetry([]);
  assert.equal(result.rejected, true);
  assert.equal(result.confirmed, false);
});
