import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { canTransitionMachine, Machine, MachineLifecycleState, MachineProvisioningInput } from '../domain/machine';
import { SupabaseRest } from '../persistence/supabase-rest';

const HEARTBEAT_TIMEOUT_MS = 90_000;

@Injectable()
export class MachineService {
  private readonly machines = new Map<string, Machine>();

  constructor(private readonly db: SupabaseRest) {}

  async provision(input: MachineProvisioningInput): Promise<Machine> {
    const now = new Date().toISOString();
    const machine: Machine = {
      id: randomUUID(), tenantId: input.tenantId, name: input.name, type: input.type,
      manufacturer: input.manufacturer, model: input.model, firmwareVersion: input.firmwareVersion,
      lifecycleState: 'provisioning', connectionState: 'unknown', adapterId: input.adapterId,
      capabilities: [...new Set(input.capabilities ?? [])], createdAt: now, updatedAt: now,
    };
    if (this.db.enabled) {
      await this.db.request('machine_connect_machines', {
        method: 'POST', body: JSON.stringify({
          id: machine.id, organization_id: machine.tenantId, machine_identity: machine.id,
          name: machine.name, machine_type: machine.type, state: machine.lifecycleState,
          capabilities: machine.capabilities, trust_level: 'untrusted',
        }),
      });
    }
    this.machines.set(machine.id, machine);
    return machine;
  }

  async list(tenantId: string): Promise<Machine[]> {
    if (this.db.enabled) {
      const rows = await this.db.request<any[]>(`machine_connect_machines?organization_id=eq.${encodeURIComponent(tenantId)}&order=updated_at.desc`);
      return rows.map(this.fromRow);
    }
    return [...this.machines.values()].filter((machine) => machine.tenantId === tenantId);
  }

  async get(tenantId: string, id: string): Promise<Machine> {
    if (this.db.enabled) {
      const rows = await this.db.request<any[]>(`machine_connect_machines?id=eq.${encodeURIComponent(id)}&organization_id=eq.${encodeURIComponent(tenantId)}&limit=1`);
      if (!rows.length) throw new NotFoundException('Machine not found');
      return this.fromRow(rows[0]);
    }
    const machine = this.machines.get(id);
    if (!machine || machine.tenantId !== tenantId) throw new NotFoundException('Machine not found');
    return machine;
  }

  async status(tenantId: string, id: string): Promise<Machine> {
    const machine = await this.get(tenantId, id);
    if (machine.lastHeartbeatAt && Date.now() - Date.parse(machine.lastHeartbeatAt) > HEARTBEAT_TIMEOUT_MS) {
      machine.connectionState = 'offline';
    }
    return machine;
  }

  async transition(tenantId: string, id: string, nextState: MachineLifecycleState): Promise<Machine> {
    const machine = await this.get(tenantId, id);
    if (!canTransitionMachine(machine.lifecycleState, nextState)) {
      throw new BadRequestException(`Invalid machine lifecycle transition: ${machine.lifecycleState} -> ${nextState}`);
    }
    const updatedAt = new Date().toISOString();
    if (this.db.enabled) {
      const rows = await this.db.request<any[]>(`machine_connect_machines?id=eq.${encodeURIComponent(id)}&organization_id=eq.${encodeURIComponent(tenantId)}`, {
        method: 'PATCH', body: JSON.stringify({ state: nextState, updated_at: updatedAt }),
      });
      if (!rows.length) throw new NotFoundException('Machine not found');
      return this.fromRow(rows[0]);
    }
    machine.lifecycleState = nextState;
    machine.updatedAt = updatedAt;
    if (nextState === 'revoked' || nextState === 'quarantined') machine.connectionState = 'offline';
    return machine;
  }

  async activate(tenantId: string, id: string): Promise<Machine> {
    return this.transition(tenantId, id, 'active');
  }

  private readonly fromRow = (row: any): Machine => ({
    id: row.id, tenantId: row.organization_id, name: row.name, type: row.machine_type,
    manufacturer: row.manufacturer, model: row.model, firmwareVersion: row.firmware_version,
    lifecycleState: row.state, connectionState: row.last_heartbeat_at ? 'online' : 'unknown',
    lastHeartbeatAt: row.last_heartbeat_at, adapterId: row.adapter_id,
    capabilities: Array.isArray(row.capabilities) ? row.capabilities : [],
    createdAt: row.created_at, updatedAt: row.updated_at,
  });
}
