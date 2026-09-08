import { BadRequestException } from '@nestjs/common';
import { ConnectorService } from './connector.service';

describe('ConnectorService', () => {
  const db = {
    enabled: true,
    request: jest.fn(async (_path: string, _init?: RequestInit) => [{ id: 'c1', provider: 'mqtt.edge', status: 'pending', protocol: 'https', endpoint: 'https://example.com', health_status: 'unknown' }]),
  } as any;

  beforeEach(() => jest.clearAllMocks());

  it('rejects malformed provider identifiers', async () => {
    const service = new ConnectorService(db);
    await expect(service.create('org-1', '00000000-0000-4000-8000-000000000001', { name: 'Edge', provider: 'MQTT!' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects plaintext-looking secret material', async () => {
    const service = new ConnectorService(db);
    await expect(service.create('org-1', '00000000-0000-4000-8000-000000000001', { name: 'Edge', provider: 'mqtt.edge', secretRef: 'mc_plaintext-secret' })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a pending connector and records an event', async () => {
    const service = new ConnectorService(db);
    const result = await service.create('org-1', '00000000-0000-4000-8000-000000000001', { name: 'Factory MQTT', provider: 'mqtt.edge', protocol: 'mqtt', endpoint: 'mqtts://broker.example.com', capabilities: ['telemetry.read'] });
    expect(result.id).toBe('c1');
    expect(db.request).toHaveBeenCalledTimes(2);
    expect(db.request.mock.calls[0][0]).toBe('machine_connect_connector_instances');
    expect(db.request.mock.calls[1][0]).toBe('machine_connect_connector_events');
  });

  it('blocks private and local HTTPS health destinations', async () => {
    const service = new ConnectorService(db);
    db.request.mockResolvedValueOnce([{ id: 'c1', protocol: 'https', endpoint: 'https://127.0.0.1:8080', status: 'active' }]);
    await expect(service.healthCheck('org-1', 'actor-1', 'c1')).resolves.toMatchObject({ healthStatus: 'blocked', latencyMs: null });
    expect(db.request).toHaveBeenCalledWith(expect.stringContaining('machine_connect_connector_instances?id=eq.c1'), expect.objectContaining({ method: 'PATCH' }));
  });

  it('does not follow redirects during health checks', async () => {
    const service = new ConnectorService(db);
    db.request.mockResolvedValueOnce([{ id: 'c1', protocol: 'https', endpoint: 'https://example.com', status: 'active' }]);
    const originalFetch = global.fetch;
    global.fetch = jest.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.redirect).toBe('manual');
      return new Response(null, { status: 204 });
    }) as any;
    await expect(service.healthCheck('org-1', 'actor-1', 'c1')).resolves.toMatchObject({ healthStatus: 'healthy' });
    global.fetch = originalFetch;
  });
});
