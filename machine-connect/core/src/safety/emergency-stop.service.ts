import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class EmergencyStopService {
  private readonly stopped = new Set<string>();
  constructor(private readonly audit: AuditService) {}
  stop(tenantId: string, actorId: string, machineId: string, reason: string) {
    this.stopped.add(`${tenantId}:${machineId}`);
    return this.audit.append({ id: randomUUID(), tenantId, actorId, action: 'emergency_stop', resourceType: 'machine', resourceId: machineId, outcome: 'allowed', timestamp: new Date().toISOString(), metadata: { reason } });
  }
  isStopped(tenantId: string, machineId: string) { return this.stopped.has(`${tenantId}:${machineId}`); }
  reset(tenantId: string, actorId: string, machineId: string) {
    this.stopped.delete(`${tenantId}:${machineId}`);
    return this.audit.append({ id: randomUUID(), tenantId, actorId, action: 'emergency_stop_reset', resourceType: 'machine', resourceId: machineId, outcome: 'pending', timestamp: new Date().toISOString() });
  }
}
