import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SupabaseRest } from '../persistence/supabase-rest';
import { FleetIntelligenceService } from './fleet-intelligence.service';
import { CommandService } from '../command/command.service';

@Injectable()
export class RemediationService {
  constructor(private readonly db: SupabaseRest, private readonly intelligence: FleetIntelligenceService, private readonly commands: CommandService) {}

  async evaluate(tenantId: string, fleetId: string, actor = 'system') {
    const health = await this.intelligence.health(tenantId, fleetId, false);
    if (!this.db.enabled) return { evaluated: health.total, actions: [], mode: 'memory' };
    const policies = await this.db.request<any[]>(`machine_connect_remediation_policies?organization_id=eq.${encodeURIComponent(tenantId)}&enabled=eq.true&order=priority.asc`);
    const actions: any[] = [];
    for (const machine of health.machines) {
      for (const policy of policies.filter(p => !p.fleet_id || p.fleet_id === fleetId)) {
        const matches = this.matches(policy, machine);
        if (!matches) continue;
        const action = policy.action ?? {};
        if (!action.capability) continue;
        const idempotencyKey = `remediation:${policy.id}:${machine.machineId}:${Math.floor(Date.now() / 60000)}`;
        try {
          const command = await this.commands.request({ tenantId, machineId: machine.machineId, capability: action.capability, parameters: action.parameters ?? {}, requestedBy: actor, idempotencyKey, safetyClass: policy.safety_class ?? 'standard' });
          actions.push({ policyId: policy.id, machineId: machine.machineId, commandId: command.commandId, status: command.status });
          await this.audit(tenantId, fleetId, machine.machineId, actor, 'remediation.command_requested', command.commandId, true, { policyId: policy.id, capability: action.capability });
        } catch (error: any) {
          await this.audit(tenantId, fleetId, machine.machineId, actor, 'remediation.command_failed', randomUUID(), false, { policyId: policy.id, error: error?.message ?? 'unknown' });
          actions.push({ policyId: policy.id, machineId: machine.machineId, status: 'failed' });
        }
      }
    }
    return { evaluated: health.total, actions, measuredAt: new Date().toISOString() };
  }

  private matches(policy: any, machine: any) {
    const trigger = policy.trigger ?? {};
    if (trigger.status && trigger.status !== machine.status) return false;
    if (trigger.min_score != null && machine.score > Number(trigger.min_score)) return false;
    if (trigger.max_score != null && machine.score > Number(trigger.max_score)) return false;
    if (trigger.signal && !machine.signals.includes(trigger.signal)) return false;
    if (trigger.connection_state && trigger.connection_state !== machine.connectionState) return false;
    if (trigger.anomaly_min != null && machine.anomalyScore < Number(trigger.anomaly_min)) return false;
    return true;
  }

  private async audit(tenantId: string, fleetId: string, machineId: string, actor: string, action: string, resourceId: string, success: boolean, details: any) {
    if (!this.db.enabled) return;
    await this.db.request('machine_connect_operational_audit', { method: 'POST', body: JSON.stringify({ organization_id: tenantId, fleet_id: fleetId, machine_id: machineId, actor_id: actor, action, resource_type: 'machine_command', resource_id: resourceId, outcome: success ? 'success' : 'failed', correlation_id: randomUUID(), details }) });
  }
}
