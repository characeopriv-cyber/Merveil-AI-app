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
