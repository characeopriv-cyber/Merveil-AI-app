import { describe, expect, it } from 'node:test';
import { OffensiveSecurityService } from './offensive-security.service';

describe('OffensiveSecurityService', () => {
  it('requires an explicit target and creates an approval-gated job', () => {
    const service = new OffensiveSecurityService();
    const job = service.createJob({
      tenantId: 'tenant-a',
      requestedBy: 'user-a',
      name: 'Authorized network assessment',
      scanType: 'network',
      mode: 'discovery',
      targets: [{ target: '198.51.100.10', targetType: 'ip' }],
    });
    expect(job.status).toBe('requested');
    expect(job.approvalRequired).toBe(true);
  });

  it('prevents cross-tenant access and self-approval', () => {
    const service = new OffensiveSecurityService();
    const job = service.createJob({
      tenantId: 'tenant-a',
      requestedBy: 'user-a',
      name: 'Assessment',
      scanType: 'web',
      mode: 'assessment',
      targets: [{ target: 'https://example.invalid', targetType: 'url' }],
    });
    expect(service.getJob(job.id, 'tenant-b')).toBeUndefined();
    expect(() => service.approveJob(job.id, 'tenant-a', 'user-a')).toThrow('requester cannot self-approve');
    expect(service.approveJob(job.id, 'tenant-a', 'security-admin')).toMatchObject({ status: 'approved', approvedBy: 'security-admin' });
  });

  it('rejects empty or excessive target lists', () => {
    const service = new OffensiveSecurityService();
    expect(() => service.createJob({ tenantId: 't', requestedBy: 'u', name: 'x', scanType: 'network', mode: 'discovery', targets: [] })).toThrow();
    expect(() => service.createJob({
      tenantId: 't', requestedBy: 'u', name: 'x', scanType: 'network', mode: 'discovery',
      targets: Array.from({ length: 101 }, (_, i) => ({ target: `198.51.100.${i}`, targetType: 'ip' as const })),
    })).toThrow('target limit exceeded');
  });
});
