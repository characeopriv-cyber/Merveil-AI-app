import { BadRequestException } from '@nestjs/common';
import { TwinService } from './twin.service';

describe('TwinService', () => {
  const machine = { id: 'machine-1', tenantId: 'tenant-1' };
  const machines = { get: jest.fn().mockResolvedValue(machine) };
  const db = { enabled: false, request: jest.fn() };

  beforeEach(() => jest.clearAllMocks());

  it('creates a versioned twin in memory', async () => {
    const service = new TwinService(db as any, machines as any);
    const first = await service.reconcile({ tenantId: 'tenant-1', machineId: 'machine-1', reportedState: { power: 'on' } });
    const second = await service.reconcile({ tenantId: 'tenant-1', machineId: 'machine-1', reportedState: { power: 'off' }, expectedVersion: 1 });
    expect(first.version).toBe(1);
    expect(second.version).toBe(2);
    expect(second.state).toEqual({ power: 'off' });
  });

  it('rejects stale optimistic versions', async () => {
    const service = new TwinService(db as any, machines as any);
    await service.reconcile({ tenantId: 'tenant-1', machineId: 'machine-1', reportedState: { temperature: 20 } });
    await expect(service.reconcile({ tenantId: 'tenant-1', machineId: 'machine-1', reportedState: { temperature: 21 }, expectedVersion: 0 }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects oversized twin state values', async () => {
    const service = new TwinService(db as any, machines as any);
    await expect(service.reconcile({ tenantId: 'tenant-1', machineId: 'machine-1', reportedState: { blob: 'x'.repeat(16_385) } }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('requires a real machine in the tenant', async () => {
    machines.get.mockRejectedValueOnce(new Error('missing'));
    const service = new TwinService(db as any, machines as any);
    await expect(service.reconcile({ tenantId: 'tenant-1', machineId: 'missing', reportedState: {} })).rejects.toThrow('missing');
  });
});
