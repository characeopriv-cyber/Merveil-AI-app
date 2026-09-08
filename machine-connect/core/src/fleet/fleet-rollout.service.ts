import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseRest } from '../persistence/supabase-rest';
import { FleetService } from './fleet.service';
import { CommandService } from '../command/command.service';

@Injectable()
export class FleetRolloutService {
  constructor(private readonly db: SupabaseRest, private readonly fleets: FleetService, private readonly commands: CommandService) {}

  async start(tenantId: string, fleetId: string, input: any) {
    if (!this.db.enabled) return { status: 'not_configured', reason: 'persistent storage required' };
    const members = await this.fleets.members(tenantId, fleetId);
    if (!members.length) throw new NotFoundException('Fleet has no machines');
    const stageSize = Math.min(Math.max(Number(input.stageSize ?? 5), 1), 25);
    const rolloutId = crypto.randomUUID();
    await this.db.request('machine_connect_fleet_rollouts', { method: 'POST', body: JSON.stringify({ id: rolloutId, organization_id: tenantId, fleet_id: fleetId, requested_by: input.requestedBy ?? 'system', capability: input.capability, parameters: input.parameters ?? {}, safety_class: input.safetyClass ?? 'standard', stage_size: stageSize, status: 'running', total_count: members.length, completed_count: 0, failed_count: 0 }) });
    const first = members.slice(0, stageSize);
    for (const machine of first) {
      try {
        const command = await this.commands.request({ tenantId, machineId: machine.id, capability: input.capability, parameters: input.parameters ?? {}, requestedBy: input.requestedBy ?? 'system', idempotencyKey: `rollout:${rolloutId}:${machine.id}`, safetyClass: input.safetyClass ?? 'standard' });
        await this.db.request('machine_connect_fleet_rollout_items', { method: 'POST', body: JSON.stringify({ rollout_id: rolloutId, organization_id: tenantId, fleet_id: fleetId, machine_id: machine.id, command_id: command.commandId, status: command.status }) });
      } catch (error: any) {
        await this.db.request('machine_connect_fleet_rollout_items', { method: 'POST', body: JSON.stringify({ rollout_id: rolloutId, organization_id: tenantId, fleet_id: fleetId, machine_id: machine.id, status: 'failed', error: error?.message ?? 'command failed' }) });
      }
    }
    return { rolloutId, status: 'running', staged: first.length, total: members.length, nextStageSize: stageSize };
  }

  async status(tenantId: string, rolloutId: string) {
    if (!this.db.enabled) throw new NotFoundException('Rollout not found');
    const rows = await this.db.request<any[]>(`machine_connect_fleet_rollouts?id=eq.${encodeURIComponent(rolloutId)}&organization_id=eq.${encodeURIComponent(tenantId)}&limit=1`);
    if (!rows.length) throw new NotFoundException('Rollout not found');
    const items = await this.db.request<any[]>(`machine_connect_fleet_rollout_items?rollout_id=eq.${encodeURIComponent(rolloutId)}&organization_id=eq.${encodeURIComponent(tenantId)}&order=created_at.asc`);
    return { ...rows[0], items };
  }
}
