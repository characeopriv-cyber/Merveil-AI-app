import test from 'node:test';
import assert from 'node:assert/strict';
import { TelemetryService } from './telemetry.service';

const machines = { get: async (tenantId: string, machineId: string) => ({ id: machineId, tenantId }) };
const db = { enabled: false };

test('telemetry is idempotent by tenant/machine/source/sequence', async () => {
  const service = new TelemetryService(db as never, machines as never);
  const input = { tenantId: 't1', machineId: 'm1', source: 'mqtt', schemaVersion: 1, sequence: 7, observedAt: new Date().toISOString(), quality: 'good' as const, data: { temperature: 21 } };
  const a = await service.append(input);
  const b = await service.append(input);
  assert.equal(a.id, b.id);
  assert.equal((await service.list('t1', 'm1')).length, 1);
  assert.equal((await service.list('other', 'm1')).length, 0);
});

test('telemetry bridges reported state into the device twin', async () => {
  const reconciled: any[] = [];
  const twins = { reconcile: async (input: any) => { reconciled.push(input); return input; } };
  const service = new TelemetryService(db as never, machines as never, twins as never);
  await service.append({
    tenantId: 't1', machineId: 'm1', source: 'connector-sync', schemaVersion: 1,
    sequence: 8, observedAt: new Date().toISOString(), quality: 'good', data: { temperature: 24, pressure: 3 },
  });
  assert.equal(reconciled.length, 1);
  assert.equal(reconciled[0].tenantId, 't1');
  assert.equal(reconciled[0].machineId, 'm1');
  assert.deepEqual(reconciled[0].reportedState, { temperature: 24, pressure: 3 });
  assert.equal(reconciled[0].source, 'telemetry:connector-sync');
});

test('non-object telemetry is wrapped before twin reconciliation', async () => {
  const reconciled: any[] = [];
  const twins = { reconcile: async (input: any) => { reconciled.push(input); return input; } };
  const service = new TelemetryService(db as never, machines as never, twins as never);
  await service.append({
    tenantId: 't1', machineId: 'm1', source: 'heartbeat', schemaVersion: 1,
    observedAt: new Date().toISOString(), quality: 'good', data: 42,
  });
  assert.deepEqual(reconciled[0].reportedState, { value: 42 });
});
