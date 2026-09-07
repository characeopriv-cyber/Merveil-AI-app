import { Injectable } from '@nestjs/common';

export interface TwinState { tenantId: string; machineId: string; updatedAt: string; telemetry: Record<string, unknown>; }

@Injectable()
export class TwinService {
  private readonly twins = new Map<string, TwinState>();
  update(tenantId: string, machineId: string, telemetry: Record<string, unknown>) {
    const twin = { tenantId, machineId, updatedAt: new Date().toISOString(), telemetry: { ...telemetry } };
    this.twins.set(`${tenantId}:${machineId}`, twin);
    return twin;
  }
  get(tenantId: string, machineId: string) { return this.twins.get(`${tenantId}:${machineId}`); }
}
