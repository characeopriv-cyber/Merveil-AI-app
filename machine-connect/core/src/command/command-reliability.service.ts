import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SupabaseRest } from '../persistence/supabase-rest';
import { CommandService } from './command.service';

@Injectable()
export class CommandReliabilityService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CommandReliabilityService.name);
  private timer?: NodeJS.Timeout;
  private running = false;
  constructor(private readonly db: SupabaseRest, private readonly commands: CommandService) {}
  onModuleInit() { if (process.env.MACHINE_CONNECT_RELIABILITY_ENABLED === 'false') return; this.timer = setInterval(() => void this.tick(), 15_000); void this.tick(); }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }
  async tick() {
    if (this.running || !this.db.enabled) return;
    this.running = true;
    try {
      const now = new Date().toISOString();
      const rows = await this.db.request<any[]>(`machine_connect_commands?status=in.(dispatched,failed)&or=(timeout_at.lt.${encodeURIComponent(now)},next_retry_at.lte.${encodeURIComponent(now)})&limit=100`);
      for (const row of rows) {
        try {
          const attempt = Number(row.attempt_count ?? 0);
          const max = Number(row.max_attempts ?? 3);
          if (attempt >= max) {
            await this.db.request(`machine_connect_commands?id=eq.${encodeURIComponent(row.id)}`, { method: 'PATCH', body: JSON.stringify({ status: 'timed_out', completed_at: now }) });
            continue;
          }
          const delay = Math.min(300_000, 2 ** Math.max(0, attempt) * 5_000);
          await this.db.request(`machine_connect_commands?id=eq.${encodeURIComponent(row.id)}`, { method: 'PATCH', body: JSON.stringify({ status: 'authorized', next_retry_at: new Date(Date.now() + delay).toISOString() }) });
          await this.commands.dispatch(row.organization_id, row.id, row.adapter_id);
        } catch (error: any) { this.logger.warn(`command recovery ${row.id}: ${error?.message ?? 'unknown'}`); }
      }
    } finally { this.running = false; }
  }
}
