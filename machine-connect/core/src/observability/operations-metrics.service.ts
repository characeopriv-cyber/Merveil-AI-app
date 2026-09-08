import { Injectable } from '@nestjs/common';
import { SupabaseRest } from '../persistence/supabase-rest';

export type FleetOperationalMetrics = {
  machines: number;
  online: number;
  offline: number;
  unknown: number;
  critical: number;
  degraded: number;
  healthy: number;
  highRisk: number;
  openAlerts: number;
  generatedAt: string;
};

@Injectable()
export class OperationsMetricsService {
  constructor(private readonly db: SupabaseRest) {}

  async fleet(organizationId: string, fleetId: string): Promise<FleetOperationalMetrics> {
    if (!this.db.enabled) return { machines: 0, online: 0, offline: 0, unknown: 0, critical: 0, degraded: 0, healthy: 0, highRisk: 0, openAlerts: 0, generatedAt: new Date().toISOString() };
    const members = await this.db.request<any[]>(`machine_connect_fleet_members?fleet_id=eq.${encodeURIComponent(fleetId)}&organization_id=eq.${encodeURIComponent(organizationId)}`);
    const ids = members.map(m => m.machine_id).filter(Boolean);
    let online = 0, offline = 0, unknown = 0;
    if (ids.length) {
      const machines = await this.db.request<any[]>(`machine_connect_machines?organization_id=eq.${encodeURIComponent(organizationId)}&id=in.(${ids.join(',')})`);
      for (const m of machines) {
        const state = m.state === 'revoked' || m.state === 'quarantined' ? 'offline' : (m.last_heartbeat_at && Date.now() - Date.parse(m.last_heartbeat_at) <= 90000 ? 'online' : 'offline');
        if (state === 'online') online++; else offline++;
      }
    }
    unknown = Math.max(0, ids.length - online - offline);
    const alerts = await this.db.request<any[]>(`machine_connect_fleet_alerts?organization_id=eq.${encodeURIComponent(organizationId)}&fleet_id=eq.${encodeURIComponent(fleetId)}&acknowledged_at=is.null&limit=1000`);
    const critical = alerts.filter(a => a.severity === 'critical').length;
    const degraded = alerts.filter(a => a.severity === 'high' || a.severity === 'medium').length;
    const highRisk = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;
    return { machines: ids.length, online, offline, unknown, critical, degraded, healthy: Math.max(0, ids.length - critical - degraded), highRisk, openAlerts: alerts.length, generatedAt: new Date().toISOString() };
  }
}
