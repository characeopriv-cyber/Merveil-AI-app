import test from 'node:test';
import assert from 'node:assert/strict';
import { TelemetryService } from './telemetry.service';

test('telemetry is idempotent by tenant/machine/source/sequence', () => {
  const service = new TelemetryService();
  const input = { tenantId: 't1', machineId: 'm1', source: 'mqtt', schemaVersion: 1, sequence: 7, observedAt: new Date().toISOString(), quality: 'good' as const, data: { temperature: 21 } };
  const a = service.append(input);
  const b = service.append(input);
  assert.equal(a.id, b.id);
  assert.equal(service.list('t1', 'm1').length, 1);
  assert.equal(service.list('other', 'm1').length, 0);
});
