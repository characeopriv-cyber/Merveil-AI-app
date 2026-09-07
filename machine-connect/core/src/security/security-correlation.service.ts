import { SecurityAlert, SecurityEvent } from './security.types';

interface FailedLoginWindow {
  tenantId: string;
  sourceIp: string;
  timestamps: number[];
}

/**
 * Deterministic first-stage SIEM correlation.
 *
 * This service intentionally produces alerts only. It never blocks traffic,
 * disables a device, or executes a command. Any response must enter the
 * existing Machine Connect authorization + safety pipeline.
 */
export class SecurityCorrelationService {
  private readonly loginWindows = new Map<string, FailedLoginWindow>();
  private readonly windowMs = 60_000;
  private readonly threshold = 5;

  process(event: SecurityEvent): SecurityAlert[] {
    if (event.type !== 'login_failure' || !event.sourceIp) return [];

    const now = Date.now();
    const key = `${event.tenantId}:${event.sourceIp}`;
    const current = this.loginWindows.get(key) ?? {
      tenantId: event.tenantId,
      sourceIp: event.sourceIp,
      timestamps: [],
    };

    current.timestamps = [...current.timestamps.filter((t) => now - t <= this.windowMs), now];
    this.loginWindows.set(key, current);

    if (current.timestamps.length < this.threshold) return [];

    return [{
      id: crypto.randomUUID(),
      tenantId: event.tenantId,
      type: 'brute_force',
      severity: 'high',
      title: 'Repeated authentication failures detected',
      details: {
        sourceIp: event.sourceIp,
        attempts: current.timestamps.length,
        windowSeconds: this.windowMs / 1000,
      },
      sourceEventIds: [event.id],
      createdAt: new Date(now).toISOString(),
    }];
  }

  clearExpired(now = Date.now()): void {
    for (const [key, value] of this.loginWindows) {
      value.timestamps = value.timestamps.filter((t) => now - t <= this.windowMs);
      if (value.timestamps.length === 0) this.loginWindows.delete(key);
    }
  }
}
