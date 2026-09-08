import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SupabaseRest } from '../persistence/supabase-rest';
import { FleetService } from './fleet.service';
import { CommandService } from '../command/command.service';

@Injectable()
export class RolloutService {
  constructor(private readonly db: SupabaseRest, private readonly fleets: FleetService, private readonly commands: CommandService) {}

  async create(input: { tenantId: string; actorId: string; fleetId: string; capability: string; parameters?: Record<string, unknown>; safetyClass?: 'read'|'control'|'critical'; stageSize?: number; maxConcurrency?: number; idempotencyKey?: string }) {
    if (!input.actorId) throw new BadRequestException('Authenticated actor context is required');
    const members = await this.fleets.members(input.tenantId, input.fleetId);
    if (!members.length) throw new BadRequestException('Fleet has no machines');
    const stageSize = Math.max(1, Math.min(input.stageSize ?? 10, 100));
    const maxConcurrency = Math.max(1, Math.min(input.maxConcurrency ?? 5, 25));
    const id = randomUUID();
    if (this.db.enabled) {
      await this.db.request('machine_connect_fleet_rollouts', { method: 'POST', body: JSON.stringify({ id, organization_id: input.tenantId, fleet_id: input.fleetId, capability: input.capability, parameters: input.parameters ?? {}, safety_class: input.safetyClass ?? 'control', stage_size: stageSize, max_concurrency: maxConcurrency, status: 'running', requested_by: input.actorId, idempotency_key: input.idempotencyKey ?? `rollout:${id}`, total_count: members.length, current_stage: 1, started_at: new Date().toISOString() }) });
      await this.db.request('machine_connect_fleet_rollout_items', { method: 'POST', body: JSON.stringify(members.map((m: any, i: number) => ({ organization_id: input.tenantId, rollout_id: id, machine_id: m.id, stage: Math.floor(i / stageSize) + 1, status: 'pending' }))), headers: { Prefer: 'return=minimal' } });
    }
    await this.run(id, input, members.map((m: any, i: number) => ({ ...m, stage: Math.floor(i / stageSize) + 1 })), maxConcurrency);
    return this.get(input.tenantId, id);
  }

  async get(tenantId: string, rolloutId: string) {
    if (!this.db.enabled) return { id: rolloutId, status: 'running' };
    const rows = await this.db.request<any[]>(`machine_connect_fleet_rollouts?id=eq.${encodeURIComponent(rolloutId)}&organization_id=eq.${encodeURIComponent(tenantId)}&limit=1`);
    if (!rows.length) throw new NotFoundException('Rollout not found');
    return rows[0];
  }

  async pause(tenantId: string, rolloutId: string) { return this.transition(tenantId, rolloutId, 'paused'); }
  async cancel(tenantId: string, rolloutId: string) { return this.transition(tenantId, rolloutId, 'cancelled'); }

  private async transition(tenantId: string, rolloutId: string, status: string) {
    await this.get(tenantId, rolloutId);
    if (!this.db.enabled) return { id: rolloutId, status };
    const rows = await this.db.request<any[]>(`machine_connect_fleet_rollouts?id=eq.${encodeURIComponent(rolloutId)}&organization_id=eq.${encodeURIComponent(tenantId)}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    return rows[0] ?? { id: rolloutId, status };
  }

  private async run(id: string, input: any, members: any[], maxConcurrency: number) {
    for (const stage of [...new Set(members.map(m => m.stage))].sort((a, b) => a - b)) {
      if (this.db.enabled) {
        const current = await this.db.request<any[]>(`machine_connect_fleet_rollouts?id=eq.${encodeURIComponent(id)}&organization_id=eq.${encodeURIComponent(input.tenantId)}&limit=1`);
        if (current[0]?.status === 'paused' || current[0]?.status === 'cancelled') return;
        await this.db.request(`machine_connect_fleet_rollouts?id=eq.${encodeURIComponent(id)}&organization_id=eq.${encodeURIComponent(input.tenantId)}`, { method: 'PATCH', body: JSON.stringify({ current_stage: stage }) });
      }
      const batch = members.filter(m => m.stage === stage);
      for (let i = 0; i < batch.length; i += maxConcurrency) {
        await Promise.all(batch.slice(i, i + maxConcurrency).map(machine => this.executeItem(id, input, machine)));
      }
    }
    if (this.db.enabled) await this.db.request(`machine_connect_fleet_rollouts?id=eq.${encodeURIComponent(id)}&organization_id=eq.${encodeURIComponent(input.tenantId)}`, { method: 'PATCH', body: JSON.stringify({ status: 'completed', completed_at: new Date().toISOString() }) });
  }

  private async executeItem(rolloutId: string, input: any, machine: any) {
    try {
      const command = await this.commands.request({ tenantId: input.tenantId, machineId: machine.id, capability: input.capability, parameters: input.parameters ?? {}, requestedBy: input.actorId, idempotencyKey: `rollout:${rolloutId}:${machine.id}`, safetyClass: input.safetyClass ?? 'control' });
      const status = command.status === 'rejected' ? 'failed' : 'completed';
      if (this.db.enabled) await this.db.request(`machine_connect_fleet_rollout_items?rollout_id=eq.${encodeURIComponent(rolloutId)}&machine_id=eq.${encodeURIComponent(machine.id)}&organization_id=eq.${encodeURIComponent(input.tenantId)}`, { method: 'PATCH', body: JSON.stringify({ command_id: command.commandId, status, updated_at: new Date().toISOString(), completed_at: status === 'completed' ? new Date().toISOString() : null, error: status === 'failed' ? 'Command rejected by policy' : null }) });
    } catch (error) {
      if (this.db.enabled) await this.db.request(`machine_connect_fleet_rollout_items?rollout_id=eq.${encodeURIComponent(rolloutId)}&machine_id=eq.${encodeURIComponent(machine.id)}&organization_id=eq.${encodeURIComponent(input.tenantId)}`, { method: 'PATCH', body: JSON.stringify({ status: 'failed', error: error instanceof Error ? error.message : String(error), updated_at: new Date().toISOString() }) });
    }
  }
}
