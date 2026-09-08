import { ConnectorSyncLedgerService } from './connector-sync-ledger.service';

describe('ConnectorSyncLedgerService', () => {
  it('claims a new key and returns a duplicate for a repeated key', async () => {
    const db = { enabled: true, request: jest.fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 'sync-1', status: 'accepted' }])
      .mockResolvedValueOnce([{ id: 'sync-1', status: 'accepted', telemetry_id: 'tel-1', job_id: 'job-1' }]) } as any;
    const service = new ConnectorSyncLedgerService(db);
    const input = { organizationId: 'org-1', connectorId: 'con-1', machineId: 'mac-1', actorId: 'usr-1', idempotencyKey: 'sync-20260908-001' };
    await expect(service.claim(input)).resolves.toMatchObject({ id: 'sync-1', duplicate: false });
    await expect(service.claim(input)).resolves.toMatchObject({ id: 'sync-1', duplicate: true, telemetryId: 'tel-1', jobId: 'job-1' });
    expect(db.request).toHaveBeenCalledTimes(3);
  });

  it('uses a local claim when persistence is disabled', async () => {
    const db = { enabled: false, request: jest.fn() } as any;
    const service = new ConnectorSyncLedgerService(db);
    await expect(service.claim({ organizationId: 'o', connectorId: 'c', machineId: 'm', actorId: 'u', idempotencyKey: 'local-0001' })).resolves.toMatchObject({ duplicate: false, status: 'accepted' });
    expect(db.request).not.toHaveBeenCalled();
  });
});
