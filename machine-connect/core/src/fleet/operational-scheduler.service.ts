import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SupabaseRest } from '../persistence/supabase-rest';
import { RemediationService } from './remediation.service';

/** Lightweight scheduler for durable fleet operations. It never creates fake device data. */
@Injectable()
export class OperationalSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OperationalSchedulerService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(private readonly db: SupabaseRest, private readonly remediation: RemediationService) {}

  onModuleInit() {
    const interval = Math.max(30_000, Number(process.env.MACHINE_CONNECT_REMEDIATION_INTERVAL_MS ?? 60_000));
    if (process.env.MACHINE_CONNECT_SCHEDULER_ENABLED === 'false') return;
    this.timer = setInterval(() => void this.tick(), interval);
    void this.tick();
  }

  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }

  async tick() {
    if (this.running || !this.db.enabled) return;
    this.running = true;
    try {
      const fleets = await this.db.request<any[]>('machine_connect_fleets?select=id,organization_id&enabled=eq.true&limit=100');
      for (const fleet of fleets) {
        try {
          await this.remediation.evaluate(fleet.organization_id, fleet.id, 'system:scheduler');
        } catch (error: any) {
          this.logger.error(`fleet remediation failed ${fleet.id}: ${error?.message ?? 'unknown'}`);
          await this.writeAudit(fleet.organization_id, fleet.id, false, error?.message ?? 'unknown');
        }
      }
    } finally { this.running = false; }
  }

  private async writeAudit(organizationId: string, fleetId: string, success: boolean, error: string) {
    await this.db.request('machine_connect_operational_audit', {
      method: 'POST',
      body: JSON.stringify({ organization_id: organizationId, fleet_id: fleetId, actor_id: 'system:scheduler', action: 'remediation.cycle', resource_type: 'fleet', resource_id: fleetId, outcome: success ? 'success' : 'failed', correlation_id: randomUUID(), details: { error } }),
    });
  }
}
