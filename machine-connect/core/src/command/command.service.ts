import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { MachineCommand, CommandStatus, canTransition } from '../domain/command';
import { MachineService } from '../machine/machine.service';
import { PolicyService } from '../safety/policy.service';
import { SupabaseRest } from '../persistence/supabase-rest';

@Injectable()
export class CommandService {
  private readonly commands = new Map<string, MachineCommand>();
  private readonly idempotency = new Map<string, string>();

  constructor(private readonly machines: MachineService, private readonly policy: PolicyService, private readonly db: SupabaseRest) {}

  private async recordEvent(command: MachineCommand, eventType: string, extra: Record<string, unknown> = {}): Promise<void> {
    if (!this.db.enabled) return;
    await this.db.request('machine_connect_events', {
      method: 'POST',
      body: JSON.stringify({
        id: randomUUID(),
        organization_id: command.tenantId,
        machine_id: command.machineId,
        event_type: eventType,
        actor_id: command.requestedBy,
        payload: { commandId: command.commandId, capability: command.capability, status: command.status, ...extra },
      }),
    });
  }

  async request(input: Omit<MachineCommand, 'commandId' | 'requestedAt' | 'status'> & { safetyClass?: 'read' | 'control' | 'critical'; capabilityKnown?: boolean }): Promise<MachineCommand> {
    const key = `${input.tenantId}:${input.idempotencyKey}`;
    const existingId = this.idempotency.get(key);
    if (existingId) return this.commands.get(existingId)!;

    const machine = await this.machines.get(input.tenantId, input.machineId);
    const decision = this.policy.evaluate({ lifecycleState: machine.lifecycleState, capabilitySafetyClass: input.safetyClass ?? 'control', capabilityKnown: input.capabilityKnown ?? false, actorAuthorized: Boolean(input.requestedBy) });
    const status: CommandStatus = !decision.allowed ? 'rejected' : decision.approvalRequired ? 'approval_required' : 'authorized';
    const command: MachineCommand = { commandId: randomUUID(), tenantId: input.tenantId, machineId: input.machineId, capability: input.capability, parameters: input.parameters, requestedBy: input.requestedBy, requestedAt: new Date().toISOString(), idempotencyKey: input.idempotencyKey, status };

    if (this.db.enabled) {
      await this.db.request('machine_connect_commands', { method: 'POST', body: JSON.stringify({ id: command.commandId, organization_id: command.tenantId, machine_id: command.machineId, action: command.capability, parameters: command.parameters, requested_by: command.requestedBy, status: command.status, created_at: command.requestedAt }) });
      await this.recordEvent(command, 'command.requested', { safetyClass: input.safetyClass ?? 'control', capabilityKnown: input.capabilityKnown ?? false });
    }
    this.commands.set(command.commandId, command); this.idempotency.set(key, command.commandId);
    return command;
  }

  async transition(tenantId: string, commandId: string, to: CommandStatus): Promise<MachineCommand> {
    const command = this.commands.get(commandId);
    if (!command || command.tenantId !== tenantId) {
      if (!this.db.enabled) throw new BadRequestException('Command not found');
      const rows = await this.db.request<any[]>(`machine_connect_commands?id=eq.${encodeURIComponent(commandId)}&organization_id=eq.${encodeURIComponent(tenantId)}&limit=1`);
      if (!rows.length) throw new BadRequestException('Command not found');
      const dbCommand: MachineCommand = { commandId: rows[0].id, tenantId: rows[0].organization_id, machineId: rows[0].machine_id, capability: rows[0].action, parameters: rows[0].parameters ?? {}, requestedBy: rows[0].requested_by, requestedAt: rows[0].created_at, idempotencyKey: commandId, status: rows[0].status };
      if (!canTransition(dbCommand.status, to)) throw new BadRequestException(`Invalid command transition: ${dbCommand.status} -> ${to}`);
      await this.db.request(`machine_connect_commands?id=eq.${encodeURIComponent(commandId)}&organization_id=eq.${encodeURIComponent(tenantId)}`, { method: 'PATCH', body: JSON.stringify({ status: to, completed_at: ['acknowledged','rejected','timed_out','failed','cancelled','emergency_stopped'].includes(to) ? new Date().toISOString() : null }) });
      await this.recordEvent({ ...dbCommand, status: to }, 'command.transitioned', { fromStatus: dbCommand.status, toStatus: to });
      return { ...dbCommand, status: to };
    }
    if (!canTransition(command.status, to)) throw new BadRequestException(`Invalid command transition: ${command.status} -> ${to}`);
    const fromStatus = command.status;
    command.status = to;
    if (this.db.enabled) {
      await this.db.request(`machine_connect_commands?id=eq.${encodeURIComponent(commandId)}&organization_id=eq.${encodeURIComponent(tenantId)}`, { method: 'PATCH', body: JSON.stringify({ status: to, completed_at: ['acknowledged','rejected','timed_out','failed','cancelled','emergency_stopped'].includes(to) ? new Date().toISOString() : null }) });
      await this.recordEvent(command, 'command.transitioned', { fromStatus, toStatus: to });
    }
    return command;
  }
}
