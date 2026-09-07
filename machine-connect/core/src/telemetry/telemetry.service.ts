import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TelemetryEnvelope } from '../domain/telemetry';
import { SupabaseRest } from '../persistence/supabase-rest';
import { MachineService } from '../machine/machine.service';

@Injectable()
export class TelemetryService {
  private readonly records = new Map<string, TelemetryEnvelope[]>();
  private readonly seen = new Map<string, TelemetryEnvelope>();

  constructor(private readonly db: SupabaseRest, private readonly machines: MachineService) {}

  async append(input: Omit<TelemetryEnvelope, 'id' | 'receivedAt'>): Promise<TelemetryEnvelope> {
    await this.machines.get(input.tenantId, input.machineId);
    const key = `${input.tenantId}:${input.machineId}:${input.source}:${input.sequence ?? input.observedAt}`;
    const existing = this.seen.get(key);
    if (existing) return existing;

    const record: TelemetryEnvelope = { ...input, id: randomUUID(), receivedAt: new Date().toISOString() };
    if (this.db.enabled) {
      const data = record.data && typeof record.data === 'object' ? record.data as Record<string, unknown> : {};
      const numeric = Object.entries(data).find(([, value]) => typeof value === 'number');
      await this.db.request('machine_connect_telemetry', {
        method: 'POST', body: JSON.stringify({
          id: record.id, organization_id: record.tenantId, machine_id: record.machineId,
          metric_name: numeric?.[0] ?? 'payload', metric_value: typeof numeric?.[1] === 'number' ? numeric[1] : 0,
          unit: typeof data.unit === 'string' ? data.unit : null, metadata: { ...data, quality: record.quality },
          source: record.source, schema_version: record.schemaVersion, observed_at: record.observedAt,
          received_at: record.receivedAt, sequence_no: record.sequence, data: record.data,
          recorded_at: record.observedAt,
        }),
      });
    }
    const list = this.records.get(input.machineId) ?? [];
    list.push(record); this.records.set(input.machineId, list); this.seen.set(key, record);
    return record;
  }

  async list(tenantId: string, machineId: string, limit = 100): Promise<TelemetryEnvelope[]> {
    await this.machines.get(tenantId, machineId);
    const safeLimit = Math.min(Math.max(Number.isFinite(limit) ? limit : 100, 1), 1000);
    if (this.db.enabled) {
      const rows = await this.db.request<any[]>(`machine_connect_telemetry?organization_id=eq.${encodeURIComponent(tenantId)}&machine_id=eq.${encodeURIComponent(machineId)}&order=observed_at.desc&limit=${safeLimit}`);
      return rows.reverse().map((row) => ({
        id: String(row.id), tenantId: row.organization_id, machineId: row.machine_id, source: row.source ?? 'unknown',
        schemaVersion: Number(row.schema_version ?? 1), sequence: row.sequence_no == null ? undefined : Number(row.sequence_no),
        observedAt: row.observed_at ?? row.recorded_at, receivedAt: row.received_at ?? row.recorded_at,
        quality: row.metadata?.quality ?? 'unknown', data: row.data ?? row.metadata ?? {},
      }));
    }
    return (this.records.get(machineId) ?? []).filter(r => r.tenantId === tenantId).slice(-safeLimit);
  }

  async heartbeat(tenantId: string, machineId: string): Promise<{ machineId: string; status: 'online'; heartbeatAt: string }> {
    const machine = await this.machines.get(tenantId, machineId);
    const heartbeatAt = new Date().toISOString();
    if (this.db.enabled) {
      await this.db.request(`machine_connect_machines?id=eq.${encodeURIComponent(machine.id)}&organization_id=eq.${encodeURIComponent(tenantId)}`, {
        method: 'PATCH', body: JSON.stringify({ state: machine.lifecycleState, last_heartbeat_at: heartbeatAt, updated_at: heartbeatAt }),
      });
    } else {
      machine.connectionState = 'online';
      machine.lastHeartbeatAt = heartbeatAt;
      machine.updatedAt = heartbeatAt;
    }
    return { machineId, status: 'online', heartbeatAt };
  }
}
