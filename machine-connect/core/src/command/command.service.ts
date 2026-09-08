import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { MachineCommand, CommandStatus, canTransition } from '../domain/command';
import { MachineService } from '../machine/machine.service';
import { PolicyService } from '../safety/policy.service';
import { EmergencyStopService } from '../safety/emergency-stop.service';
import { SupabaseRest } from '../persistence/supabase-rest';
import { SecurityEventService } from '../security/security-event.service';
import { CommandDispatcherService, CommandDispatchResult } from './command-dispatcher.service';

@Injectable()
export class CommandService {
  private readonly commands = new Map<string, MachineCommand>();
  private readonly idempotency = new Map<string, string>();

  constructor(private readonly machines: MachineService, private readonly policy: PolicyService, private readonly emergencyStop: EmergencyStopService, private readonly db: SupabaseRest, private readonly dispatcher: CommandDispatcherService, private readonly securityEvents: SecurityEventService) {}

  private async recordEvent(command: MachineCommand, eventType: string, extra: Record<string, unknown> = {}): Promise<void> {
    if (!this.db.enabled) return;
    await this.db.request('machine_connect_events', { method: 'POST', body: JSON.stringify({ id: randomUUID(), organization_id: command.tenantId, machine_id: command.machineId, event_type: eventType, actor_id: command.requestedBy, payload: { commandId: command.commandId, capability: command.capability, status: command.status, ...extra } }) });
    await this.securityEvents.record({ organizationId: command.tenantId, actorId: command.requestedBy, eventType: `command.${eventType}`, severity: eventType.includes('failed') || eventType.includes('rejected') ? 'warn' : 'info', resourceType: 'command', resourceId: command.commandId, metadata: { machineId: command.machineId, capability: command.capability, status: command.status, ...extra } });
  }

  private fromRow(row: any): MachineCommand { return { commandId: row.id, tenantId: row.organization_id, machineId: row.machine_id, capability: row.action, parameters: row.parameters ?? {}, requestedBy: row.requested_by, requestedAt: row.created_at, idempotencyKey: row.idempotency_key ?? row.id, status: row.status, ...(row.attempt_count != null ? { attemptCount: row.attempt_count } : {}), ...(row.adapter_id ? { adapterId: row.adapter_id } : {}) } as MachineCommand; }
  private cache(command: MachineCommand): MachineCommand { this.commands.set(command.commandId, command); this.idempotency.set(`${command.tenantId}:${command.idempotencyKey}`, command.commandId); return command; }
  private async findDurable(tenantId: string, idempotencyKey: string): Promise<MachineCommand | null> { if (!this.db.enabled) return null; const rows = await this.db.request<any[]>(`machine_connect_commands?organization_id=eq.${encodeURIComponent(tenantId)}&idempotency_key=eq.${encodeURIComponent(idempotencyKey)}&limit=1`); return rows.length ? this.cache(this.fromRow(rows[0])) : null; }
  private async findDurableById(tenantId: string, commandId: string): Promise<MachineCommand | null> { if (!this.db.enabled) return null; const rows = await this.db.request<any[]>(`machine_connect_commands?id=eq.${encodeURIComponent(commandId)}&organization_id=eq.${encodeURIComponent(tenantId)}&limit=1`); return rows.length ? this.cache(this.fromRow(rows[0])) : null; }

  async request(input: Omit<MachineCommand, 'commandId' | 'requestedAt' | 'status'> & { safetyClass?: 'read' | 'control' | 'critical'; capabilityKnown?: boolean }): Promise<MachineCommand> {
    const key = `${input.tenantId}:${input.idempotencyKey}`; const existingId = this.idempotency.get(key); if (existingId) return this.commands.get(existingId)!;
    const durableExisting = await this.findDurable(input.tenantId, input.idempotencyKey); if (durableExisting) return durableExisting;
    const machine = await this.machines.get(input.tenantId, input.machineId); const capabilityKnown = machine.capabilities.includes(input.capability);
    const stopped = this.emergencyStop.isStopped(input.tenantId, input.machineId);
    const decision = stopped ? { allowed: false, approvalRequired: false, reason: 'Machine is emergency-stopped' } : this.policy.evaluate({ lifecycleState: machine.lifecycleState, capabilitySafetyClass: input.safetyClass ?? 'control', capabilityKnown, actorAuthorized: Boolean(input.requestedBy) });
    const status: CommandStatus = !decision.allowed ? 'rejected' : decision.approvalRequired ? 'approval_required' : 'authorized';
    const command: MachineCommand = { commandId: randomUUID(), tenantId: input.tenantId, machineId: input.machineId, capability: input.capability, parameters: input.parameters, requestedBy: input.requestedBy, requestedAt: new Date().toISOString(), idempotencyKey: input.idempotencyKey, status };
    if (this.db.enabled) {
      try { await this.db.request('machine_connect_commands', { method: 'POST', body: JSON.stringify({ id: command.commandId, organization_id: command.tenantId, machine_id: command.machineId, action: command.capability, parameters: command.parameters, requested_by: command.requestedBy, status: command.status, idempotency_key: command.idempotencyKey, created_at: command.requestedAt }) }); }
      catch (error) { const message = error instanceof Error ? error.message : String(error); if (message.includes('23505') || message.includes('409') || message.includes('duplicate key')) { const raced = await this.findDurable(input.tenantId, input.idempotencyKey); if (raced) return raced; } throw error; }
      await this.recordEvent(command, stopped ? 'rejected.emergency_stop' : 'requested', { safetyClass: input.safetyClass ?? 'control', capabilityKnown });
    }
    return this.cache(command);
  }

  async dispatch(tenantId: string, commandId: string, adapterId?: string): Promise<CommandDispatchResult> {
    const command = this.commands.get(commandId) ?? await this.findDurableById(tenantId, commandId); if (!command || command.tenantId !== tenantId) throw new BadRequestException('Command not found');
    if (!canTransition(command.status, 'dispatched')) throw new BadRequestException(`Command cannot be dispatched from ${command.status}`);
    if (this.emergencyStop.isStopped(tenantId, command.machineId)) throw new BadRequestException('Machine is emergency-stopped');
    const result = await this.dispatcher.dispatch(command, adapterId);
    if (result.status !== 'dispatched') { command.status = 'failed'; await this.recordEvent(command, 'dispatch_failed', { adapterId: result.adapterId, error: result.error, attemptCount: result.attemptCount }); return result; }
    command.status = 'dispatched'; (command as any).attemptCount = result.attemptCount; (command as any).adapterId = result.adapterId;
    await this.recordEvent(command, 'dispatched', { adapterId: result.adapterId, dispatchedAt: result.dispatchedAt, timeoutAt: result.timeoutAt, attemptCount: result.attemptCount }); return result;
  }

  async acknowledgeMachine(tenantId: string, machineId: string, commandId: string): Promise<MachineCommand> {
    const command = this.commands.get(commandId) ?? await this.findDurableById(tenantId, commandId); if (!command || command.tenantId !== tenantId) throw new BadRequestException('Command not found');
    if (command.machineId !== machineId) throw new UnauthorizedException('Command is bound to a different machine');
    if (command.status !== 'dispatched') throw new BadRequestException(`Command cannot be acknowledged from ${command.status}`);
    return this.transition(tenantId, commandId, 'acknowledged');
  }

  async transition(tenantId: string, commandId: string, to: CommandStatus): Promise<MachineCommand> {
    const command = this.commands.get(commandId) ?? await this.findDurableById(tenantId, commandId); if (!command || command.tenantId !== tenantId) throw new BadRequestException('Command not found');
    if (!canTransition(command.status, to)) throw new BadRequestException(`Invalid command transition: ${command.status} -> ${to}`);
    const fromStatus = command.status; command.status = to;
    if (this.db.enabled) await this.db.request(`machine_connect_commands?id=eq.${encodeURIComponent(commandId)}&organization_id=eq.${encodeURIComponent(tenantId)}`, { method: 'PATCH', body: JSON.stringify({ status: to, acknowledged_at: to === 'acknowledged' ? new Date().toISOString() : undefined, completed_at: ['acknowledged','rejected','timed_out','failed','cancelled','emergency_stopped'].includes(to) ? new Date().toISOString() : null }) });
    await this.recordEvent(command, 'transitioned', { fromStatus, toStatus: to }); return command;
  }
}
