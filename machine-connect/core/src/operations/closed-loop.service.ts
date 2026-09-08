import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CommandService } from '../command/command.service';
import { TwinService } from '../twin/twin.service';
import { SupabaseRest } from '../persistence/supabase-rest';
import { OperationalEvent, OperationalRule } from './operations.types';

@Injectable()
export class ClosedLoopService {
  constructor(private readonly commands: CommandService, private readonly twins: TwinService, private readonly db: SupabaseRest) {}

  async executeRuleAction(rule: OperationalRule, event: OperationalEvent): Promise<{ actionId: string; commandId?: string; status: string }> {
    if (!rule.action) return { actionId: randomUUID(), status: 'no_action' };
    if (!event.machineId) throw new BadRequestException('rule action requires a machine-bound event');
    const actionId = randomUUID();
    const correlationId = event.correlationId;
    const requestedBy = `rule:${rule.id}`;
    const idempotencyKey = `rule:${rule.id}:event:${event.id}`;
    if (rule.action.type === 'command') {
      const command = await this.commands.request({ tenantId: event.tenantId, machineId: event.machineId, capability: rule.action.capability, parameters: rule.action.parameters ?? {}, requestedBy, idempotencyKey, safetyClass: rule.action.safetyClass ?? 'control' });
      await this.recordAction(actionId, rule, event, command.commandId, command.status, correlationId);
      if (command.status === 'authorized') await this.commands.dispatch(event.tenantId, command.commandId);
      return { actionId, commandId: command.commandId, status: command.status };
    }
    if (rule.action.type === 'twin_patch') {
      const current = await this.twins.get(event.tenantId, event.machineId);
      const state = { ...(current?.state ?? {}), ...rule.action.state };
      await this.twins.reconcile({ tenantId: event.tenantId, machineId: event.machineId, reportedState: state, source: `rule:${rule.id}`, expectedVersion: current?.version, correlationId });
      await this.recordAction(actionId, rule, event, undefined, 'completed', correlationId);
      return { actionId, status: 'completed' };
    }
    throw new BadRequestException('unsupported rule action');
  }

  private async recordAction(actionId: string, rule: OperationalRule, event: OperationalEvent, commandId: string | undefined, status: string, correlationId: string) {
    if (!this.db.enabled) return;
    await this.db.request('machine_connect_rule_actions', { method: 'POST', body: JSON.stringify({ id: actionId, organization_id: event.tenantId, rule_id: rule.id, event_id: event.id, command_id: commandId ?? null, action_type: rule.action?.type ?? 'none', status, correlation_id: correlationId, created_at: new Date().toISOString() }) });
  }
}
