import { ChrysalisService } from './chrysalis.service';

const principal = { actorId: 'actor-1', tenantId: 'org-1', roles: ['operator'] as const };

function serviceWithMemory() {
  const db = { enabled: false, request: jest.fn() } as any;
  const machines = { get: jest.fn().mockResolvedValue({
    id: 'machine-1', tenantId: 'org-1', name: 'Legacy TV', type: 'consumer-electronics',
    manufacturer: 'Samsung', model: 'LN46C630', lifecycleState: 'active', capabilities: ['hdmi_input'],
  }) } as any;
  return { service: new ChrysalisService(db, machines), machines };
}

describe('ChrysalisService', () => {
  it('computes missing capabilities without pretending an upgrade happened', async () => {
    const { service } = serviceWithMemory();
    const result = await service.assessDevice({
      machineId: 'machine-1',
      desiredCapabilities: ['wifi', 'smart_tv', 'voice_control'],
    }, principal as any);

    expect(result.assessment.missing_capabilities).toEqual(['wifi', 'smart_tv', 'voice_control']);
    expect(result.recommendations).toHaveLength(3);
    expect(result.recommendations.every((item: any) => item.complexity === 'unknown')).toBe(true);
  });

  it('does not require persistence just to calculate a local assessment', async () => {
    const { service, machines } = serviceWithMemory();
    await service.assessDevice({ machineId: 'machine-1', desiredCapabilities: ['wifi'] }, principal as any);
    expect(machines.get).toHaveBeenCalledWith('org-1', 'machine-1');
  });
});
