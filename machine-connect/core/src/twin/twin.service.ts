import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SupabaseRest } from '../persistence/supabase-rest';
import { MachineService } from '../machine/machine.service';
import { DeviceTwin, TwinReconcileInput } from './twin.types';

const MAX_STATE_KEYS = 200;
const MAX_VALUE_BYTES = 16_384;

@Injectable()
export class TwinService {
  private readonly cache = new Map<string, DeviceTwin>();

  constructor(private readonly db: SupabaseRest, private readonly machines: MachineService) {}

  async get(tenantId: string, machineId: string): Promise<DeviceTwin | null> {
    const cached = this.cache.get(`${tenantId}:${machineId}`);
    if (cached) return cached;
    if (!this.db.enabled) return null;
    const rows = await this.db.request<any[]>(`machine_connect_twin_snapshots?organization_id=eq.${encodeURIComponent(tenantId)}&machine_id=eq.${encodeURIComponent(machineId)}&order=observed_at.desc&limit=1`);
    return rows.length ? this.fromRow(rows[0]) : null;
  }

  async reconcile(input: TwinReconcileInput): Promise<DeviceTwin> {
    if (!input.tenantId || !input.machineId) throw new BadRequestException('tenant and machine are required');
    await this.machines.get(input.tenantId, input.machineId);
    this.validateState(input.reportedState);
    const observedAt = input.observedAt ? new Date(input.observedAt).toISOString() : new Date().toISOString();
    const key = `${input.tenantId}:${input.machineId}`;
    const previous = await this.get(input.tenantId, input.machineId);
    const previousVersion = previous?.version ?? 0;
    if (input.expectedVersion != null && input.expectedVersion !== previousVersion) {
      throw new BadRequestException(`Twin version conflict: expected ${input.expectedVersion}, current ${previousVersion}`);
    }
    const sameState = previous && JSON.stringify(previous.state) === JSON.stringify(input.reportedState);
    const twin: DeviceTwin = {
      id: randomUUID(), tenantId: input.tenantId, machineId: input.machineId,
      twinType: 'machine', observedAt, state: input.reportedState,
      twinState: sameState ? 'synchronized' : previous ? 'synchronized' : 'unknown',
      version: previousVersion + 1, createdAt: new Date().toISOString(),
    };
    if (this.db.enabled) {
      await this.db.request('machine_connect_twin_snapshots', { method: 'POST', body: JSON.stringify({ id: twin.id, organization_id: twin.tenantId, machine_id: twin.machineId, twin_type: twin.twinType, observed_at: twin.observedAt, state: twin.state, created_at: twin.createdAt }) });
      await this.db.request(`machine_connect_events`, { method: 'POST', body: JSON.stringify({ id: randomUUID(), organization_id: twin.tenantId, machine_id: twin.machineId, event_type: 'twin.reconciled', actor_id: null, payload: { twinId: twin.id, version: twin.version, source: input.source ?? 'reported_state', changed: !sameState } }) });
    }
    this.cache.set(key, twin);
    return twin;
  }

  async history(tenantId: string, machineId: string, limit = 50): Promise<DeviceTwin[]> {
    const bounded = Math.max(1, Math.min(100, Number.isFinite(limit) ? Math.floor(limit) : 50));
    if (!this.db.enabled) {
      const current = this.cache.get(`${tenantId}:${machineId}`);
      return current ? [current] : [];
    }
    await this.machines.get(tenantId, machineId);
    const rows = await this.db.request<any[]>(`machine_connect_twin_snapshots?organization_id=eq.${encodeURIComponent(tenantId)}&machine_id=eq.${encodeURIComponent(machineId)}&order=observed_at.desc&limit=${bounded}`);
    return rows.map((row) => this.fromRow(row));
  }

  private validateState(state: Record<string, unknown>): void {
    if (!state || typeof state !== 'object' || Array.isArray(state)) throw new BadRequestException('reportedState must be an object');
    const keys = Object.keys(state);
    if (keys.length > MAX_STATE_KEYS) throw new BadRequestException(`reportedState exceeds ${MAX_STATE_KEYS} keys`);
    for (const key of keys) {
      if (key.length > 120) throw new BadRequestException('twin state key too long');
      const bytes = Buffer.byteLength(JSON.stringify(state[key] ?? null), 'utf8');
      if (bytes > MAX_VALUE_BYTES) throw new BadRequestException(`twin state value exceeds ${MAX_VALUE_BYTES} bytes`);
    }
  }

  private fromRow(row: any): DeviceTwin {
    if (!row.machine_id || !row.organization_id) throw new NotFoundException('Twin is incomplete');
    return {
      id: row.id, tenantId: row.organization_id, machineId: row.machine_id,
      twinType: row.twin_type, observedAt: row.observed_at, state: row.state ?? {},
      simulation: row.simulation ?? undefined, twinState: 'synchronized', version: Number(row.state?.__version ?? 1), createdAt: row.created_at,
    };
  }
}
