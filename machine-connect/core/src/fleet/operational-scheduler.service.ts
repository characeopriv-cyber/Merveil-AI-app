import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SupabaseRest } from '../persistence/supabase-rest';
import { RemediationService } from './remediation.service';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Durable fleet remediation scheduler. It never invents machine/device data. */
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
    const actorId = process.env.MACHINE_CONNECT_SYSTEM_ACTOR_ID?.trim();
    if (!actorId || !UUID_RE.test(actorId)) {
      this.logger.warn('Remediation scheduler disabled: MACHINE_CONNECT_SYSTEM_ACTOR_ID must be a valid UUID');
      return;
    }
    this.running = true;
    try {
      const fleets = await this.db.request<any[]>('machine_connect_fleets?select=id,organization_id&order=created_at.asc&limit=100');
      for (const fleet of fleets) {
        try {
          await this.remediation.evaluate(fleet.organization_id, fleet.id, actorId);
        } catch (error: any) {
          this.logger.error(`fleet remediation failed ${fleet.id}: ${error?.message ?? 'unknown'}`);
          await this.writeAudit(fleet.organization_id, fleet.id, actorId, error?.message ?? 'unknown');
        }
      }
    } finally { this.running = false; }
  }

  private async writeAudit(organizationId: string, fleetId: string, actorId: string, error: string) {
    await this.db.request('machine_connect_operational_audit', {
      method: 'POST',
      body: JSON.stringify({ organization_id: organizationId, fleet_id: fleetId, actor_id: actorId, action: 'remediation.cycle', resource_type: 'fleet', resource_id: fleetId, outcome: 'failed', correlation_id: randomUUID(), details: { error } }),
    });
  }
}
