import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SupabaseRest } from '../persistence/supabase-rest';
import { MachineService } from '../machine/machine.service';
import { CommandService } from '../command/command.service';

export type BulkStatus = 'pending' | 'running' | 'completed' | 'partial' | 'failed' | 'cancelled';

@Injectable()
export class FleetService {
  constructor(private readonly db: SupabaseRest, private readonly machines: MachineService, private readonly commands: CommandService) {}

  async create(tenantId: string, name: string, description?: string, createdBy?: string) {
    if (!name?.trim()) throw new BadRequestException('Fleet name is required');
    if (!this.db.enabled) return { id: randomUUID(), organizationId: tenantId, name: name.trim(), description };
    const rows = await this.db.request<any[]>('machine_connect_fleets', { method: 'POST', body: JSON.stringify({ organization_id: tenantId, name: name.trim(), description: description ?? null, created_by: createdBy ?? null }), headers: { Prefer: 'return=representation' } });
    return rows[0];
  }

  async list(tenantId: string) {
    if (!this.db.enabled) return [];
    return this.db.request<any[]>(`machine_connect_fleets?organization_id=eq.${encodeURIComponent(tenantId)}&order=created_at.desc`);
  }

  async addMachines(tenantId: string, fleetId: string, machineIds: string[]) {
    if (!machineIds.length) throw new BadRequestException('At least one machine is required');
    const unique = [...new Set(machineIds)];
    for (const id of unique) await this.machines.get(tenantId, id);
    if (!this.db.enabled) return unique.map(machineId => ({ fleetId, machineId }));
    return this.db.request<any[]>('machine_connect_fleet_members', { method: 'POST', body: JSON.stringify(unique.map(machine_id => ({ fleet_id: fleetId, machine_id, added_at: new Date().toISOString() }))), headers: { Prefer: 'return=representation,resolution=merge-duplicates' } });
  }

  async members(tenantId: string, fleetId: string) {
    if (!this.db.enabled) return [];
    const fleets = await this.db.request<any[]>(`machine_connect_fleets?id=eq.${encodeURIComponent(fleetId)}&organization_id=eq.${encodeURIComponent(tenantId)}&limit=1`);
    if (!fleets.length) throw new NotFoundException('Fleet not found');
    const rows = await this.db.request<any[]>(`machine_connect_fleet_members?fleet_id=eq.${encodeURIComponent(fleetId)}&select=machine_id,added_at`);
    return Promise.all(rows.map(row => this.machines.get(tenantId, row.machine_id)));
  }

  async bulkCommand(input: { tenantId: string; requestedBy: string; fleetId: string; capability: string; parameters: Record<string, unknown>; safetyClass?: 'read'|'control'|'critical'; maxParallel?: number }) {
    const targets = await this.members(input.tenantId, input.fleetId);
    if (!targets.length) throw new BadRequestException('Fleet has no machines');
    if (!input.capability?.trim()) throw new BadRequestException('Capability is required');
    const maxParallel = Math.max(1, Math.min(input.maxParallel ?? 5, 25));
    const id = randomUUID();
    if (this.db.enabled) await this.db.request('machine_connect_bulk_operations', { method: 'POST', body: JSON.stringify({ id, organization_id: input.tenantId, fleet_id: input.fleetId, requested_by: input.requestedBy, capability: input.capability, parameters: input.parameters ?? {}, safety_class: input.safetyClass ?? 'control', status: 'running', total_count: targets.length, started_at: new Date().toISOString() }) });
    let accepted = 0, rejected = 0, failed = 0;
    const items: any[] = [];
    for (let i = 0; i < targets.length; i += maxParallel) {
      const batch = targets.slice(i, i + maxParallel);
      const results = await Promise.all(batch.map(async machine => {
        try {
          const command = await this.commands.request({ tenantId: input.tenantId, machineId: machine.id, capability: input.capability, parameters: input.parameters ?? {}, requestedBy: input.requestedBy, idempotencyKey: `bulk:${id}:${machine.id}`, safetyClass: input.safetyClass ?? 'control' });
          if (command.status === 'rejected') rejected++; else accepted++;
          return { bulkOperationId: id, organizationId: input.tenantId, machineId: machine.id, commandId: command.commandId, status: command.status === 'rejected' ? 'rejected' : 'accepted' };
        } catch (error) {
          failed++; return { bulkOperationId: id, organizationId: input.tenantId, machineId: machine.id, status: 'failed', error: error instanceof Error ? error.message : String(error) };
        }
      }));
      items.push(...results);
      if (this.db.enabled) await this.db.request('machine_connect_bulk_operation_items', { method: 'POST', body: JSON.stringify(results.map(x => ({ bulk_operation_id: x.bulkOperationId, organization_id: x.organizationId, machine_id: x.machineId, command_id: x.commandId ?? null, status: x.status, error: x.error ?? null }))), headers: { Prefer: 'return=minimal,resolution=merge-duplicates' } });
    }
    const status: BulkStatus = failed === targets.length ? 'failed' : rejected + failed === 0 ? 'completed' : 'partial';
    if (this.db.enabled) await this.db.request(`machine_connect_bulk_operations?id=eq.${encodeURIComponent(id)}&organization_id=eq.${encodeURIComponent(input.tenantId)}`, { method: 'PATCH', body: JSON.stringify({ status, accepted_count: accepted, rejected_count: rejected, failed_count: failed, completed_count: 0, completed_at: new Date().toISOString() }) });
    return { id, fleetId: input.fleetId, status, totalCount: targets.length, acceptedCount: accepted, rejectedCount: rejected, failedCount: failed, items };
  }
}
