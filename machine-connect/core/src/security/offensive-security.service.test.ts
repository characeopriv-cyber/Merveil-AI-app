import test from 'node:test';
import assert from 'node:assert/strict';
import { OffensiveSecurityService } from './offensive-security.service';

test('offensive security requires an explicit target and creates an approval-gated job', () => {
  const service = new OffensiveSecurityService();
  const job = service.createJob({ tenantId: 'tenant-a', requestedBy: 'user-a', name: 'Authorized network assessment', scanType: 'network', mode: 'discovery', targets: [{ target: '198.51.100.10', targetType: 'ip' }] });
  assert.equal(job.status, 'requested');
  assert.equal(job.approvalRequired, true);
});

test('offensive security prevents cross-tenant access and self-approval', () => {
  const service = new OffensiveSecurityService();
  const job = service.createJob({ tenantId: 'tenant-a', requestedBy: 'user-a', name: 'Assessment', scanType: 'web', mode: 'assessment', targets: [{ target: 'https://example.invalid', targetType: 'url' }] });
  assert.equal(service.getJob(job.id, 'tenant-b'), undefined);
  assert.throws(() => service.approveJob(job.id, 'tenant-a', 'user-a'), /requester cannot self-approve/);
  assert.equal(service.approveJob(job.id, 'tenant-a', 'security-admin').status, 'approved');
});

test('offensive security rejects empty or excessive target lists', () => {
  const service = new OffensiveSecurityService();
  assert.throws(() => service.createJob({ tenantId: 't', requestedBy: 'u', name: 'x', scanType: 'network', mode: 'discovery', targets: [] }));
  assert.throws(() => service.createJob({ tenantId: 't', requestedBy: 'u', name: 'x', scanType: 'network', mode: 'discovery', targets: Array.from({ length: 101 }, (_, i) => ({ target: `198.51.100.${i}`, targetType: 'ip' as const })) }), /target limit exceeded/);
});
