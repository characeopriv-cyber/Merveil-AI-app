import { BadRequestException } from '@nestjs/common';
import { ConnectorSyncService } from './connector-sync.service';

describe('ConnectorSyncService', () => {
  const connector = { id: '00000000-0000-4000-8000-000000000010', provider: 'http.generic', protocol: 'https', endpoint: 'https://example.com/telemetry', status: 'active', health_status: 'healthy', configuration: {} };
  const connectors = { get: jest.fn(async () => connector) } as any;
  const telemetry = { append: jest.fn(async () => ({ id: '00000000-0000-4000-8000-000000000020' })) } as any;
  const jobs = { enqueue: jest.fn(async () => ({ id: '00000000-0000-4000-8000-000000000030' })) } as any;

  beforeEach(() => { jest.clearAllMocks(); });

  it('normalizes an HTTPS JSON response into telemetry and a sync job', async () => {
    const service = new ConnectorSyncService(connectors, telemetry, jobs);
    const originalFetch = global.fetch;
    global.fetch = jest.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.method).toBe('GET');
      expect(init?.redirect).toBe('manual');
      return new Response(JSON.stringify({ temperature: 22.5, unit: 'C' }), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as any;

    const result = await service.sync('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', connector.id, '00000000-0000-4000-8000-000000000003');
    expect(result).toMatchObject({ connectorId: connector.id, machineId: '00000000-0000-4000-8000-000000000003', telemetryId: '00000000-0000-4000-8000-000000000020', jobId: '00000000-0000-4000-8000-000000000030' });
    expect(telemetry.append).toHaveBeenCalledWith(expect.objectContaining({ machineId: '00000000-0000-4000-8000-000000000003', source: expect.stringContaining('connector:http.generic') }));
    expect(jobs.enqueue).toHaveBeenCalledWith(expect.any(String), expect.any(String), expect.objectContaining({ jobType: 'connector_sync', connectorId: connector.id }));
    global.fetch = originalFetch;
  });

  it('rejects non-active connectors before network access', async () => {
    connectors.get.mockResolvedValueOnce({ ...connector, status: 'disabled' });
    const service = new ConnectorSyncService(connectors, telemetry, jobs);
    await expect(service.sync('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', connector.id, '00000000-0000-4000-8000-000000000003')).rejects.toBeInstanceOf(BadRequestException);
    expect(telemetry.append).not.toHaveBeenCalled();
  });

  it('blocks private synchronization destinations', async () => {
    connectors.get.mockResolvedValueOnce({ ...connector, endpoint: 'https://127.0.0.1:8080/telemetry' });
    const service = new ConnectorSyncService(connectors, telemetry, jobs);
    await expect(service.sync('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', connector.id, '00000000-0000-4000-8000-000000000003')).rejects.toBeInstanceOf(BadRequestException);
    expect(telemetry.append).not.toHaveBeenCalled();
  });

  it('rejects oversized responses before ingestion', async () => {
    const service = new ConnectorSyncService(connectors, telemetry, jobs);
    const originalFetch = global.fetch;
    global.fetch = jest.fn(async () => new Response('x'.repeat(64 * 1024 + 1), { status: 200, headers: { 'content-type': 'text/plain' } })) as any;
    await expect(service.sync('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', connector.id, '00000000-0000-4000-8000-000000000003')).rejects.toBeInstanceOf(BadRequestException);
    expect(telemetry.append).not.toHaveBeenCalled();
    global.fetch = originalFetch;
  });

  it('rejects redirects instead of following them', async () => {
    const service = new ConnectorSyncService(connectors, telemetry, jobs);
    const originalFetch = global.fetch;
    global.fetch = jest.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.redirect).toBe('manual');
      return new Response(null, { status: 302, headers: { location: 'https://attacker.example/' } });
    }) as any;
    await expect(service.sync('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', connector.id, '00000000-0000-4000-8000-000000000003')).rejects.toBeInstanceOf(BadRequestException);
    expect(telemetry.append).not.toHaveBeenCalled();
    global.fetch = originalFetch;
  });
});
