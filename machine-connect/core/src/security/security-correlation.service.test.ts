import { describe, expect, it } from 'node:test';
import { SecurityCorrelationService } from './security-correlation.service';
import { SecurityEvent } from './security.types';

describe('SecurityCorrelationService', () => {
  it('alerts after five failed logins from one IP in one minute', () => {
    const service = new SecurityCorrelationService();
    const base: Omit<SecurityEvent, 'id' | 'occurredAt'> = {
      tenantId: 'tenant-1',
      type: 'login_failure',
      severity: 'medium',
      source: 'auth',
      sourceIp: '203.0.113.10',
      details: {},
    };

    let alerts = [] as ReturnType<typeof service.process>;
    for (let i = 0; i < 4; i += 1) {
      alerts = service.process({ ...base, id: `e-${i}`, occurredAt: new Date().toISOString() });
      expect(alerts).toHaveLength(0);
    }

    alerts = service.process({ ...base, id: 'e-4', occurredAt: new Date().toISOString() });
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe('brute_force');
    expect(alerts[0].details.attempts).toBe(5);
  });

  it('isolates correlation state by tenant and source IP', () => {
    const service = new SecurityCorrelationService();
    const make = (tenantId: string, sourceIp: string, i: number): SecurityEvent => ({
      id: `${tenantId}-${sourceIp}-${i}`,
      tenantId,
      type: 'login_failure',
      severity: 'low',
      source: 'auth',
      sourceIp,
      occurredAt: new Date().toISOString(),
      details: {},
    });

    for (let i = 0; i < 4; i += 1) {
      service.process(make('tenant-a', '203.0.113.20', i));
      service.process(make('tenant-b', '203.0.113.20', i));
    }

    expect(service.process(make('tenant-a', '203.0.113.20', 4))).toHaveLength(1);
    expect(service.process(make('tenant-b', '203.0.113.21', 4))).toHaveLength(0);
  });
});
