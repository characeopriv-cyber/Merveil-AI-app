import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseRest } from '../persistence/supabase-rest';
import { MachineService } from '../machine/machine.service';
import { TelemetryService } from '../telemetry/telemetry.service';
import { FleetService } from './fleet.service';

export type FleetHealthStatus = 'healthy' | 'degraded' | 'critical' | 'unknown';

@Injectable()
export class FleetIntelligenceService {
  constructor(
    private readonly db: SupabaseRest,
    private readonly machines: MachineService,
    private readonly telemetry: TelemetryService,
    private readonly fleets: FleetService,
  ) {}

  async health(tenantId: string, fleetId: string, persist = true) {
    const members = await this.fleets.members(tenantId, fleetId);
    if (!members.length) return { fleetId, status: 'unknown' as const, score: 0, total: 0, online: 0, offline: 0, degraded: 0, critical: 0, machines: [], measuredAt: new Date().toISOString() };

    const machines = await Promise.all(members.map(machine => this.machines.status(tenantId, machine.id)));
    const machineHealth = await Promise.all(machines.map(async machine => this.machineHealth(tenantId, fleetId, machine)));
    const score = Math.round(machineHealth.reduce((sum, item) => sum + item.score, 0) / machineHealth.length);
    const counts = machineHealth.reduce((a, item) => { a[item.status]++; if (item.connectionState === 'online') a.online++; if (item.connectionState === 'offline') a.offline++; return a; }, { online: 0, offline: 0, healthy: 0, degraded: 0, critical: 0, unknown: 0 } as Record<string, number>);
    const status: FleetHealthStatus = score >= 85 && counts.critical === 0 ? 'healthy' : score >= 60 && counts.critical === 0 ? 'degraded' : score > 0 ? 'critical' : 'unknown';
    const measuredAt = new Date().toISOString();

    if (persist && this.db.enabled) {
      await this.db.request('machine_connect_health_snapshots', { method: 'POST', body: JSON.stringify(machineHealth.map(item => ({ organization_id: tenantId, fleet_id: fleetId, machine_id: item.machineId, health_score: item.score, status: item.status, connection_state: item.connectionState, heartbeat_age_seconds: item.heartbeatAgeSeconds, telemetry_age_seconds: item.telemetryAgeSeconds, anomaly_score: item.anomalyScore, signals: item.signals, measured_at: measuredAt }))), headers: { Prefer: 'return=minimal' } });
      await this.upsertAlerts(tenantId, fleetId, machineHealth);
    }
    return { fleetId, status, score, total: machineHealth.length, ...counts, machines: machineHealth, measuredAt };
  }

  async summary(tenantId: string, fleetId: string) {
    const current = await this.health(tenantId, fleetId, false);
    let alerts: any[] = [];
    if (this.db.enabled) alerts = await this.db.request<any[]>(`machine_connect_fleet_alerts?organization_id=eq.${encodeURIComponent(tenantId)}&fleet_id=eq.${encodeURIComponent(fleetId)}&status=eq.open&order=last_seen_at.desc&limit=50`);
    return { ...current, alerts };
  }

  async history(tenantId: string, fleetId: string, limit = 100) {
    if (!this.db.enabled) return [];
    const safe = Math.min(Math.max(Number(limit) || 100, 1), 500);
    return this.db.request<any[]>(`machine_connect_health_snapshots?organization_id=eq.${encodeURIComponent(tenantId)}&fleet_id=eq.${encodeURIComponent(fleetId)}&order=measured_at.desc&limit=${safe}`);
  }

  async risk(tenantId: string, fleetId: string) {
    const current = await this.health(tenantId, fleetId, false);
    const history = (await this.history(tenantId, fleetId, 100)).reverse();
    const byMachine = new Map<string, any[]>();
    for (const row of history) byMachine.set(row.machine_id, [...(byMachine.get(row.machine_id) ?? []), row]);

    const machines = current.machines.map((machine: any) => {
      const samples = byMachine.get(machine.machineId) ?? [];
      const scores = samples.map(row => Number(row.health_score)).filter(Number.isFinite);
      const baseline = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : machine.score;
      const recent = scores.length >= 3 ? scores.slice(-3) : scores;
      const slope = recent.length >= 2 ? (recent[recent.length - 1] - recent[0]) / (recent.length - 1) : 0;
      const trendRisk = Math.min(40, Math.max(0, -slope * 8));
      const anomalyRisk = Math.min(30, Number(machine.anomalyScore ?? 0) * 30);
      const operationalRisk = machine.status === 'critical' ? 30 : machine.status === 'degraded' ? 15 : machine.connectionState === 'offline' ? 25 : 0;
      const riskScore = Math.round(Math.min(100, Math.max(0, trendRisk + anomalyRisk + operationalRisk)));
      const level = riskScore >= 70 ? 'critical' : riskScore >= 40 ? 'high' : riskScore >= 20 ? 'medium' : 'low';
      return { machineId: machine.machineId, name: machine.name, riskScore, level, baselineHealth: Math.round(baseline), currentHealth: machine.score, trendPerSample: Number(slope.toFixed(2)), samples: scores.length, signals: machine.signals };
    });
    machines.sort((a: any, b: any) => b.riskScore - a.riskScore);
    const fleetRisk = machines.length ? Math.round(machines.reduce((sum: number, item: any) => sum + item.riskScore, 0) / machines.length) : 0;
    return { fleetId, riskScore: fleetRisk, level: fleetRisk >= 70 ? 'critical' : fleetRisk >= 40 ? 'high' : fleetRisk >= 20 ? 'medium' : 'low', machines, generatedAt: new Date().toISOString() };
  }

  async acknowledgeAlert(tenantId: string, alertId: string, actor: string) {
    if (!this.db.enabled) throw new BadRequestException('Persistent storage is required');
    const rows = await this.db.request<any[]>(`machine_connect_fleet_alerts?id=eq.${encodeURIComponent(alertId)}&organization_id=eq.${encodeURIComponent(tenantId)}&limit=1`);
    if (!rows.length) throw new NotFoundException('Alert not found');
    const now = new Date().toISOString();
    const updated = await this.db.request<any[]>(`machine_connect_fleet_alerts?id=eq.${encodeURIComponent(alertId)}&organization_id=eq.${encodeURIComponent(tenantId)}`, { method: 'PATCH', body: JSON.stringify({ status: 'acknowledged', acknowledged_at: now, acknowledged_by: actor }) });
    return updated[0] ?? { ...rows[0], status: 'acknowledged', acknowledged_at: now, acknowledged_by: actor };
  }

  private async machineHealth(tenantId: string, fleetId: string, machine: any) {
    const now = Date.now();
    const heartbeatAgeSeconds = machine.lastHeartbeatAt ? Math.max(0, Math.floor((now - Date.parse(machine.lastHeartbeatAt)) / 1000)) : null;
    const telemetry = await this.telemetry.list(tenantId, machine.id, 20);
    const latest = telemetry.at(-1);
    const telemetryAgeSeconds = latest?.observedAt ? Math.max(0, Math.floor((now - Date.parse(latest.observedAt)) / 1000)) : null;
    const numeric = telemetry.map(t => Object.values(t.data ?? {}).find(v => typeof v === 'number')).filter((v): v is number => typeof v === 'number');
    const mean = numeric.length ? numeric.reduce((a, b) => a + b, 0) / numeric.length : 0;
    const deviations = numeric.map(v => Math.abs(v - mean)).sort((a, b) => a - b);
    const medianDeviation = deviations.length ? deviations[Math.floor(deviations.length / 2)] : 0;
    const latestValue = numeric.at(-1);
    const anomalyScore = latestValue == null || medianDeviation === 0 ? 0 : Math.min(1, Math.abs(latestValue - mean) / (6 * medianDeviation));
    const signals: string[] = [];
    let score = 100;
    if (machine.connectionState === 'offline') { score -= 45; signals.push('offline'); }
    else if (machine.connectionState === 'unknown') { score -= 20; signals.push('connection_unknown'); }
    if (heartbeatAgeSeconds == null) { score -= 20; signals.push('heartbeat_missing'); }
    else if (heartbeatAgeSeconds > 90) { score -= 30; signals.push('heartbeat_stale'); }
    else if (heartbeatAgeSeconds > 45) { score -= 10; signals.push('heartbeat_delayed'); }
    if (telemetryAgeSeconds == null) { score -= 15; signals.push('telemetry_missing'); }
    else if (telemetryAgeSeconds > 300) { score -= 20; signals.push('telemetry_stale'); }
    if (anomalyScore >= 0.75) { score -= 25; signals.push('telemetry_anomaly'); }
    else if (anomalyScore >= 0.4) { score -= 10; signals.push('telemetry_drift'); }
    if (machine.lifecycleState === 'quarantined') { score -= 35; signals.push('quarantined'); }
    if (machine.lifecycleState === 'revoked') { score = 0; signals.push('revoked'); }
    score = Math.max(0, Math.min(100, score));
    const status: FleetHealthStatus = score >= 85 ? 'healthy' : score >= 60 ? 'degraded' : score > 0 ? 'critical' : 'unknown';
    return { machineId: machine.id, name: machine.name, status, score, connectionState: machine.connectionState, lifecycleState: machine.lifecycleState, heartbeatAgeSeconds, telemetryAgeSeconds, anomalyScore: Number(anomalyScore.toFixed(4)), signals };
  }

  private async upsertAlerts(tenantId: string, fleetId: string, items: any[]) {
    for (const item of items.filter(x => x.status === 'critical' || x.signals.includes('telemetry_anomaly') || x.signals.includes('offline'))) {
      const severity = item.status === 'critical' ? 'critical' : 'warning';
      const alertType = item.status === 'critical' ? 'machine_health_critical' : item.signals.includes('telemetry_anomaly') ? 'telemetry_anomaly' : 'machine_offline';
      const fingerprint = `${fleetId}:${item.machineId}:${alertType}`;
      const existing = await this.db.request<any[]>(`machine_connect_fleet_alerts?organization_id=eq.${encodeURIComponent(tenantId)}&fingerprint=eq.${encodeURIComponent(fingerprint)}&status=eq.open&limit=1`);
      const now = new Date().toISOString();
      if (existing.length) await this.db.request(`machine_connect_fleet_alerts?id=eq.${encodeURIComponent(existing[0].id)}&organization_id=eq.${encodeURIComponent(tenantId)}`, { method: 'PATCH', body: JSON.stringify({ last_seen_at: now, details: item }) });
      else await this.db.request('machine_connect_fleet_alerts', { method: 'POST', body: JSON.stringify({ organization_id: tenantId, fleet_id: fleetId, machine_id: item.machineId, alert_type: alertType, severity, title: `${item.name}: ${alertType.replaceAll('_', ' ')}`, message: item.signals.join(', '), fingerprint, details: item, first_seen_at: now, last_seen_at: now }) });
    }
  }
}
