import test from 'node:test';
import assert from 'node:assert/strict';
import { RemediationService } from './remediation.service';

test('remediation is idempotent and approval gated', () => {
  const s = new RemediationService();
  const a = s.request({ tenantId: 't1', requestedBy: 'u1', action: 'patch', targetId: 'd1', reason: 'validated finding', idempotencyKey: 'k1' });
  const b = s.request({ tenantId: 't1', requestedBy: 'u1', action: 'patch', targetId: 'd1', reason: 'duplicate', idempotencyKey: 'k1' });
  assert.equal(a.id, b.id);
  assert.throws(() => s.approve(a.id, 't1', 'u1'), /self-approve/);
  assert.equal(s.approve(a.id, 't1', 'u2').status, 'approved');
});

test('remediation isolates tenants', () => {
  const s = new RemediationService();
  const job = s.request({ tenantId: 't1', requestedBy: 'u1', action: 'retest', targetId: 'd1', reason: 'verify fix', idempotencyKey: 'k1' });
  assert.equal(s.get(job.id, 't2'), undefined);
  assert.throws(() => s.approve(job.id, 't2', 'u2'), /not found/);
});
