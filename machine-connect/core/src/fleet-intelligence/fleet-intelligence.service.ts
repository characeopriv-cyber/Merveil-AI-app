import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseRest } from '../persistence/supabase-rest';
import { MachineService } from '../machine/machine.service';
import { TelemetryService } from '../telemetry/telemetry.service';

export type FleetMachineHealth = {
  machineId: string;
  name: string;
  connectionState: 'unknown' | 'online' | 'offline';
  lifecycleState: string;
  score: number;
  status: 'healthy' | 'degraded' | 'critical' | 'unknown';
  lastHeartbeatAt?: string;
  telemetryCount: number;
  staleTelemetry: boolean;
  anomalies: string[];
};

@Injectable()
export class FleetIntelligenceService {
  constructor(
    private readonly db: SupabaseRest,
    private readonly machines: MachineService,
    private readonly telemetry: TelemetryService,
  ) {}

  async fleetHealth(tenantId: string, fleetId: string) {
    const fleetRows = this.db.enabled
      ? await this.db.request<any[]>(`machine_connect_fleets?id=eq.${encodeURIComponent(fleetId)}&organization_id=eq.${encodeURIComponent(tenantId)}&limit=1`)
      : [];
    if (this.db.enabled && !fleetRows.length) throw new NotFoundException('Fleet not found');

    const memberRows = this.db.enabled
      ? await this.db.request<any[]>(`machine_connect_fleet_members?organization_id=eq.${encodeURIComponent(tenantId)}&fleet_id=eq.${encodeURIComponent(fleetId)}&select=machine_id&limit=1000`)
      : [];
    const machineIds = [...new Set(memberRows.map(row => String(row.machine_id)))];
    const machines = await Promise.all(machineIds.map(id => this.machines.status(tenantId, id).catch(() => null)));
    const health: FleetMachineHealth[] = [];

    for (const machine of machines) {
      if (!machine) continue;
      const telemetry = await this.telemetry.list(tenantId, machine.id, 50).catch(() => []);
      const latest = telemetry.at(-1);
      const staleTelemetry = !latest || Date.now() - Date.parse(latest.observedAt) > 5 * 60_000;
      const anomalies = this.detectAnomalies(telemetry.map(t => t.data));
      let score = 100;
      if (machine.connectionState === 'offline') score -= 45;
      else if (machine.connectionState === 'unknown') score -= 20;
      if (staleTelemetry) score -= 20;
      if (machine.lifecycleState === 'quarantined') score -= 35;
      if (machine.lifecycleState === 'maintenance') score -= 10;
      score -= Math.min(30, anomalies.length * 10);
      score = Math.max(0, Math.min(100, score));
      health.push({
        machineId: machine.id,
        name: machine.name,
        connectionState: machine.connectionState,
        lifecycleState: machine.lifecycleState,
        score,
        status: score >= 80 ? 'healthy' : score >= 55 ? 'degraded' : score > 0 ? 'critical' : 'unknown',
        lastHeartbeatAt: machine.lastHeartbeatAt,
        telemetryCount: telemetry.length,
        staleTelemetry,
        anomalies,
      });
    }

    const scores = health.map(item => item.score);
    const averageScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return {
      fleetId,
      tenantId,
      generatedAt: new Date().toISOString(),
      machineCount: health.length,
      onlineCount: health.filter(item => item.connectionState === 'online').length,
      offlineCount: health.filter(item => item.connectionState === 'offline').length,
      averageScore,
      status: averageScore >= 80 ? 'healthy' : averageScore >= 55 ? 'degraded' : health.length ? 'critical' : 'unknown',
      machines: health,
    };
  }

  private detectAnomalies(samples: unknown[]): string[] {
    const numeric: Record<string, number[]> = {};
    for (const sample of samples) {
      if (!sample || typeof sample !== 'object' || Array.isArray(sample)) continue;
      for (const [key, value] of Object.entries(sample as Record<string, unknown>)) {
        if (typeof value === 'number' && Number.isFinite(value)) (numeric[key] ??= []).push(value);
      }
    }
    const anomalies: string[] = [];
    for (const [key, values] of Object.entries(numeric)) {
      if (values.length < 4) continue;
      const sorted = [...values].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)];
      const deviations = values.map(value => Math.abs(value - median));
      const madSorted = [...deviations].sort((a, b) => a - b);
      const mad = madSorted[Math.floor(madSorted.length / 2)];
      const latest = values.at(-1)!;
      const threshold = mad === 0 ? Math.max(Math.abs(median) * 0.5, 1) : mad * 4;
      if (Math.abs(latest - median) > threshold) anomalies.push(`${key}:latest-value-outlier`);
    }
    return anomalies.slice(0, 5);
  }
}
