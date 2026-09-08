import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SupabaseRest } from '../persistence/supabase-rest';
import { FleetService } from './fleet.service';
import { CommandService } from '../command/command.service';

@Injectable()
export class RolloutService {
  constructor(private readonly db: SupabaseRest, private readonly fleets: FleetService, private readonly commands: CommandService) {}

  async create(input: { tenantId: string; actorId: string; fleetId: string; capability: string; parameters?: Record<string, unknown>; safetyClass?: 'read'|'control'|'critical'; stageSize?: number; maxConcurrency?: number; idempotencyKey?: string }) {
    if (!input.tenantId || !input.actorId || !input.fleetId || !input.capability?.trim()) throw new BadRequestException('Tenant, authenticated actor, fleet and capability are required');
    if (!this.db.enabled) throw new BadRequestException('Persistent storage is required for rollouts');
    const existingKey = input.idempotencyKey?.trim();
    if (existingKey) {
      const existing = await this.db.request<any[]>(`machine_connect_fleet_rollouts?organization_id=eq.${encodeURIComponent(input.tenantId)}&idempotency_key=eq.${encodeURIComponent(existingKey)}&limit=1`);
      if (existing.length) return existing[0];
    }
    const members = await this.fleets.members(input.tenantId, input.fleetId);
    if (!members.length) throw new BadRequestException('Fleet has no machines');
    const stageSize = Math.max(1, Math.min(Number(input.stageSize ?? 10), 100));
    const maxConcurrency = Math.max(1, Math.min(Number(input.maxConcurrency ?? 5), 25));
    const id = randomUUID();
    const key = existingKey || `rollout:${id}`;
    await this.db.request('machine_connect_fleet_rollouts', { method: 'POST', body: JSON.stringify({ id, organization_id: input.tenantId, fleet_id: input.fleetId, capability: input.capability.trim(), parameters: input.parameters ?? {}, safety_class: input.safetyClass ?? 'control', stage_size: stageSize, max_concurrency: maxConcurrency, status: 'pending', requested_by: input.actorId, idempotency_key: key, total_count: members.length, completed_count: 0, failed_count: 0, current_stage: 0 }) });
    await this.db.request('machine_connect_fleet_rollout_items', { method: 'POST', body: JSON.stringify(members.map((m: any, i: number) => ({ organization_id: input.tenantId, rollout_id: id, machine_id: m.id, stage: Math.floor(i / stageSize) + 1, status: 'pending' }))) });
    return this.get(input.tenantId, id);
  }

  async run(tenantId: string, rolloutId: string) {
    let rollout = await this.get(tenantId, rolloutId);
    if (!['pending', 'running'].includes(rollout.status)) return rollout;
    await this.patch(tenantId, rolloutId, { status: 'running', started_at: rollout.started_at ?? new Date().toISOString() });
    const items = await this.db.request<any[]>(`machine_connect_fleet_rollout_items?organization_id=eq.${encodeURIComponent(tenantId)}&rollout_id=eq.${encodeURIComponent(rolloutId)}&order=stage.asc`);
    const machines = new Map((await this.fleets.members(tenantId, rollout.fleet_id)).map((m: any) => [m.id, m]));
    const stages = [...new Set(items.map(x => Number(x.stage)))].sort((a,b) => a-b);
    for (const stage of stages) {
      rollout = await this.get(tenantId, rolloutId);
      if (rollout.status === 'paused' || rollout.status === 'cancelled') return rollout;
      await this.patch(tenantId, rolloutId, { current_stage: stage });
      const stageItems = items.filter(x => Number(x.stage) === stage && x.status === 'pending');
      const concurrency = Math.min(Math.max(1, Number(rollout.max_concurrency ?? 5)), 25);
      for (let i = 0; i < stageItems.length; i += concurrency) {
        const batch = stageItems.slice(i, i + concurrency);
        await Promise.all(batch.map(item => this.executeItem(tenantId, rollout, item, machines.get(item.machine_id))));
        rollout = await this.get(tenantId, rolloutId);
        if (rollout.status === 'paused' || rollout.status === 'cancelled') return rollout;
      }
    }
    return this.recalculate(tenantId, rolloutId);
  }

  async get(tenantId: string, rolloutId: string) {
    const rows = await this.db.request<any[]>(`machine_connect_fleet_rollouts?id=eq.${encodeURIComponent(rolloutId)}&organization_id=eq.${encodeURIComponent(tenantId)}&limit=1`);
    if (!rows.length) throw new NotFoundException('Rollout not found');
    return rows[0];
  }

  async list(tenantId: string, fleetId?: string) {
    const filter = fleetId ? `&fleet_id=eq.${encodeURIComponent(fleetId)}` : '';
    return this.db.request<any[]>(`machine_connect_fleet_rollouts?organization_id=eq.${encodeURIComponent(tenantId)}${filter}&order=created_at.desc&limit=100`);
  }

  async pause(tenantId: string, rolloutId: string) {
    const rollout = await this.get(tenantId, rolloutId);
    if (!['pending', 'running'].includes(rollout.status)) throw new BadRequestException(`Cannot pause rollout from ${rollout.status}`);
    await this.patch(tenantId, rolloutId, { status: 'paused' });
    return this.get(tenantId, rolloutId);
  }

  async cancel(tenantId: string, rolloutId: string) {
    const rollout = await this.get(tenantId, rolloutId);
    if (['completed', 'partial', 'failed', 'cancelled'].includes(rollout.status)) return rollout;
    await this.patch(tenantId, rolloutId, { status: 'cancelled', completed_at: new Date().toISOString() });
    return this.get(tenantId, rolloutId);
  }

  private async executeItem(tenantId: string, rollout: any, item: any, machine: any) {
    if (!machine) return this.finishItem(tenantId, item.id, 'failed', 'Machine is no longer in fleet');
    await this.patchItem(tenantId, item.id, { status: 'running' });
    try {
      const command = await this.commands.request({ tenantId, machineId: machine.id, capability: rollout.capability, parameters: rollout.parameters ?? {}, requestedBy: rollout.requested_by, idempotencyKey: `rollout:${rollout.id}:${machine.id}`, safetyClass: rollout.safety_class });
      if (command.status === 'rejected') return this.finishItem(tenantId, item.id, 'failed', 'Command rejected by safety policy', command.commandId);
      return this.finishItem(tenantId, item.id, 'completed', undefined, command.commandId);
    } catch (error: any) { return this.finishItem(tenantId, item.id, 'failed', error?.message ?? 'Command failed'); }
  }

  private async finishItem(tenantId: string, itemId: string, status: string, error?: string, commandId?: string) {
    await this.patchItem(tenantId, itemId, { status, error: error ?? null, command_id: commandId ?? null });
  }
  private async patchItem(tenantId: string, id: string, body: Record<string, unknown>) {
    await this.db.request(`machine_connect_fleet_rollout_items?id=eq.${encodeURIComponent(id)}&organization_id=eq.${encodeURIComponent(tenantId)}`, { method: 'PATCH', body: JSON.stringify(body) });
  }
  private async patch(tenantId: string, id: string, body: Record<string, unknown>) {
    await this.db.request(`machine_connect_fleet_rollouts?id=eq.${encodeURIComponent(id)}&organization_id=eq.${encodeURIComponent(tenantId)}`, { method: 'PATCH', body: JSON.stringify(body) });
  }
  private async recalculate(tenantId: string, id: string) {
    const items = await this.db.request<any[]>(`machine_connect_fleet_rollout_items?organization_id=eq.${encodeURIComponent(tenantId)}&rollout_id=eq.${encodeURIComponent(id)}`);
    const completed = items.filter(x => x.status === 'completed').length;
    const failed = items.filter(x => x.status === 'failed').length;
    const pending = items.filter(x => ['pending', 'running'].includes(x.status)).length;
    const status = failed === items.length ? 'failed' : pending > 0 ? 'running' : failed ? 'partial' : 'completed';
    await this.patch(tenantId, id, { completed_count: completed, failed_count: failed, status, completed_at: pending ? null : new Date().toISOString() });
    return this.get(tenantId, id);
  }
}
