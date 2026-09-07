import { Injectable } from '@nestjs/common';

export interface AuditEvent {
  id: string;
  tenantId: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  outcome: 'allowed' | 'denied' | 'pending' | 'failed';
  timestamp: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  private readonly events: AuditEvent[] = [];
  append(event: AuditEvent): AuditEvent { this.events.push(Object.freeze({ ...event })); return event; }
  list(tenantId: string, limit = 100): AuditEvent[] { return this.events.filter(e => e.tenantId === tenantId).slice(-Math.min(limit, 1000)); }
}
