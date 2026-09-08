import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SupabaseRest } from '../persistence/supabase-rest';
import { FleetIntelligenceService } from './fleet-intelligence.service';
import { CommandService } from '../command/command.service';

@Injectable()
export class RemediationService {
  constructor(private readonly db: SupabaseRest, private readonly intelligence: FleetIntelligenceService, private readonly commands: CommandService) {}

  async evaluate(tenantId: string, fleetId: string, actor: string) {
    if (!actor) throw new BadRequestException('Authenticated actor context is required');
    const health = await this.intelligence.health(tenantId, fleetId, false);
    if (!this.db.enabled) return { evaluated: health.total, actions: [], mode: 'memory' };
    const policies = await this.db.request<any[]>(`machine_connect_remediation_policies?organization_id=eq.${encodeURIComponent(tenantId)}&enabled=eq.true&order=created_at.asc`);
    const actions: any[] = [];
    for (const machine of health.machines) {
      for (const policy of policies.filter(p => !p.fleet_id || p.fleet_id === fleetId)) {
        if (!this.matches(policy, machine)) continue;
        const recent = await this.db.request<any[]>(`machine_connect_operational_audit?organization_id=eq.${encodeURIComponent(tenantId)}&action=eq.remediation.command_requested&machine_id=eq.${encodeURIComponent(machine.machineId)}&order=created_at.desc&limit=1`);
        if (recent[0] && policy.cooldown_seconds > 0 && Date.now() - Date.parse(recent[0].created_at) < Number(policy.cooldown_seconds) * 1000) continue;
        const idempotencyKey = `remediation:${policy.id}:${machine.machineId}:${Math.floor(Date.now() / Math.max(60000, Number(policy.cooldown_seconds || 60) * 1000))}`;
        try {
          const command = await this.commands.request({ tenantId, machineId: machine.machineId, capability: policy.capability, parameters: policy.parameters ?? {}, requestedBy: actor, idempotencyKey, safetyClass: policy.safety_class ?? 'control' });
          const ok = command.status !== 'rejected';
          actions.push({ policyId: policy.id, machineId: machine.machineId, commandId: command.commandId, status: command.status });
          await this.audit(tenantId, fleetId, machine.machineId, actor, 'remediation.command_requested', command.commandId, ok, { policyId: policy.id, triggerType: policy.trigger_type, capability: policy.capability });
        } catch (error: any) {
          actions.push({ policyId: policy.id, machineId: machine.machineId, status: 'failed' });
          await this.audit(tenantId, fleetId, machine.machineId, actor, 'remediation.command_failed', randomUUID(), false, { policyId: policy.id, error: error?.message ?? 'unknown' });
        }
      }
    }
    return { evaluated: health.total, actions, measuredAt: new Date().toISOString() };
  }

  private matches(policy: any, machine: any) {
    const threshold = Number(policy.threshold ?? 0);
    switch (policy.trigger_type) {
      case 'critical_health': return machine.status === 'critical' || machine.score <= threshold;
      case 'offline': return machine.connectionState === 'offline';
      case 'telemetry_anomaly': return machine.anomalyScore >= threshold;
      case 'risk_threshold': return machine.score <= threshold;
      default: return false;
    }
  }

  private async audit(tenantId: string, fleetId: string, machineId: string, actor: string, action: string, resourceId: string, success: boolean, details: any) {
    await this.db.request('machine_connect_operational_audit', { method: 'POST', body: JSON.stringify({ organization_id: tenantId, fleet_id: fleetId, machine_id: machineId, actor_id: actor, action, resource_type: 'machine_command', resource_id: resourceId, outcome: success ? 'success' : 'failed', correlation_id: randomUUID(), details }) });
  }
}
