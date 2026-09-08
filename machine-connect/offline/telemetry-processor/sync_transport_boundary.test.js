const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSyncEnvelope, nextBackoffMs } = require('./sync_transport_boundary');

test('buildSyncEnvelope creates stable idempotency identity', () => {
  const envelope = buildSyncEnvelope({ id: 42, table_name: 'telemetry', record_id: 'sensor-1', operation: 'insert', data: { temperature: 25 } });
  assert.equal(envelope.queue_id, '42');
  assert.equal(envelope.idempotency_key, 'offline-sync:42');
  assert.equal(envelope.operation, 'insert');
});

test('buildSyncEnvelope rejects invalid queue rows', () => {
  assert.throws(() => buildSyncEnvelope({ id: 'not-a-number' }), /invalid sync queue row/);
});

test('backoff is bounded and exponential', () => {
  assert.equal(nextBackoffMs(0), 1000);
  assert.equal(nextBackoffMs(1), 2000);
  assert.equal(nextBackoffMs(2), 4000);
  assert.ok(nextBackoffMs(99) <= 60 * 60 * 1000);
});

test('envelope never contains a credential', () => {
  const envelope = buildSyncEnvelope({ id: 7, table_name: 'telemetry', record_id: 'sensor-1', operation: 'insert', data: { ok: true } });
  assert.equal(Object.prototype.hasOwnProperty.call(envelope, 'credential'), false);
  assert.equal(Object.prototype.hasOwnProperty.call(envelope, 'token'), false);
});
