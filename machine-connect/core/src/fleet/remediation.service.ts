import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SupabaseRest } from '../persistence/supabase-rest';
import { FleetIntelligenceService } from './fleet-intelligence.service';
import { CommandService } from '../command/command.service';

@Injectable()
export class RemediationService {
  constructor(private readonly db: SupabaseRest, private readonly intelligence: FleetIntelligenceService, private readonly commands: CommandService) {}

  async evaluate(tenantId: string, fleetId: string, actorId: string) {
    if (!actorId) throw new BadRequestException('Authenticated actor context is required');
    const health = await this.intelligence.health(tenantId, fleetId, true);
    if (!this.db.enabled) return { fleetId, evaluated: health.total, actions: [] };
    const policies = await this.db.request<any[]>(`machine_connect_remediation_policies?organization_id=eq.${encodeURIComponent(tenantId)}&enabled=eq.true&order=created_at.asc`);
    const actions: any[] = [];
    for (const machine of health.machines as any[]) for (const policy of policies) {
      if (policy.fleet_id && policy.fleet_id !== fleetId) continue;
      if (!this.matches(policy, machine)) continue;
      const cooldown = Math.max(0, Number(policy.cooldown_seconds ?? 0));
      if (cooldown && await this.inCooldown(tenantId, policy.id, machine.machineId, cooldown)) continue;
      try {
        const command = await this.commands.request({ tenantId, machineId: machine.machineId, capability: policy.capability, parameters: policy.parameters ?? {}, requestedBy: actorId, idempotencyKey: `remediation:${policy.id}:${machine.machineId}:${Math.floor(Date.now() / 60000)}`, safetyClass: policy.safety_class ?? 'control' });
        actions.push({ policyId: policy.id, machineId: machine.machineId, commandId: command.commandId, status: command.status });
        await this.audit(tenantId, fleetId, machine.machineId, actorId, 'remediation.command_requested', command.commandId, command.status !== 'rejected', { policyId: policy.id, triggerType: policy.trigger_type, capability: policy.capability });
      } catch (error: any) {
        actions.push({ policyId: policy.id, machineId: machine.machineId, status: 'failed' });
        await this.audit(tenantId, fleetId, machine.machineId, actorId, 'remediation.command_failed', randomUUID(), false, { policyId: policy.id, error: error?.message ?? 'unknown' });
      }
    }
    return { fleetId, evaluated: health.total, actions, measuredAt: new Date().toISOString() };
  }

  private matches(policy: any, machine: any) {
    switch (policy.trigger_type) {
      case 'critical_health': return machine.status === 'critical';
      case 'offline': return machine.connectionState === 'offline' || machine.signals.includes('offline');
      case 'telemetry_anomaly': return Number(machine.anomalyScore ?? 0) >= Number(policy.threshold ?? 0.75);
      case 'risk_threshold': return machine.score <= Number(policy.threshold ?? 40);
      default: return false;
    }
  }

  private async inCooldown(tenantId: string, policyId: string, machineId: string, seconds: number) {
    const since = new Date(Date.now() - seconds * 1000).toISOString();
    const rows = await this.db.request<any[]>(`machine_connect_operational_audit?organization_id=eq.${encodeURIComponent(tenantId)}&action=eq.remediation.command_requested&machine_id=eq.${encodeURIComponent(machineId)}&created_at=gte.${encodeURIComponent(since)}&details->>policyId=eq.${encodeURIComponent(policyId)}&limit=1`);
    return rows.length > 0;
  }

  private async audit(tenantId: string, fleetId: string, machineId: string, actorId: string, action: string, resourceId: string, success: boolean, details: any) {
    await this.db.request('machine_connect_operational_audit', { method: 'POST', body: JSON.stringify({ organization_id: tenantId, fleet_id: fleetId, machine_id: machineId, actor_id: actorId, action, resource_type: 'machine_command', resource_id: resourceId, outcome: success ? 'success' : 'failed', correlation_id: randomUUID(), details }) });
  }
}
