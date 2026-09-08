import { BadRequestException } from '@nestjs/common';
import { OperationsService } from './operations.service';

describe('OperationsService', () => {
  const machine = { get: jest.fn().mockResolvedValue({ id: 'machine-1' }) } as any;
  const db = { enabled: false, request: jest.fn() } as any;
  let service: OperationsService;

  beforeEach(() => { service = new OperationsService(db, machine); });

  it('matches numeric telemetry conditions', async () => {
    await service.createRule({ tenantId: 'tenant-1', name: 'High temp', eventType: 'telemetry.received', conditions: [{ field: 'temperature', operator: 'gt', value: 80 }] });
    const event = await service.publish({ tenantId: 'tenant-1', machineId: 'machine-1', eventType: 'telemetry.received', source: 'test', occurredAt: new Date().toISOString(), schemaVersion: 1, causationId: 'cause-1', payload: { temperature: 90 } });
    const result = await service.evaluate(event);
    expect(result.some(r => r.matched)).toBe(true);
  });

  it('enforces cooldown', async () => {
    await service.createRule({ tenantId: 'tenant-1', name: 'Cooldown', eventType: 'telemetry.received', cooldownSeconds: 60, conditions: [{ field: 'state', operator: 'eq', value: 'alarm' }] });
    const event = await service.publish({ tenantId: 'tenant-1', machineId: 'machine-1', eventType: 'telemetry.received', source: 'test', occurredAt: new Date().toISOString(), schemaVersion: 1, causationId: 'cause-2', payload: { state: 'alarm' } });
    const first = await service.evaluate(event);
    const second = await service.evaluate(event);
    expect(first.some(r => r.matched)).toBe(true);
    expect(second.some(r => r.reason === 'cooldown')).toBe(true);
  });

  it('rejects unsupported operators', async () => {
    await expect(service.createRule({ tenantId: 'tenant-1', name: 'bad', eventType: 'telemetry.received', conditions: [{ field: 'x', operator: 'exec' as any, value: 1 }] })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('keeps duplicate causation idempotent', async () => {
    const input = { tenantId: 'tenant-1', machineId: 'machine-1', eventType: 'telemetry.received', source: 'test', occurredAt: new Date().toISOString(), schemaVersion: 1, causationId: 'same-cause', payload: { x: 1 } };
    const a = await service.publish(input); const b = await service.publish(input);
    expect(a.id).toBe(b.id);
  });
});
