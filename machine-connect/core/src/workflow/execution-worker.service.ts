import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SupabaseRest } from '../persistence/supabase-rest';
import { WorkflowService } from './workflow.service';

/** Autonomous bounded worker. It only executes durable queued work; all authorization
 * and command safety remain inside WorkflowService -> ClosedLoopService -> CommandService. */
@Injectable()
export class ExecutionWorkerService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(private readonly db: SupabaseRest, private readonly workflows: WorkflowService) {}

  onModuleInit(): void {
    if (!this.db.enabled) return;
    const intervalMs = this.readPositiveInt(process.env.MC_WORKFLOW_WORKER_INTERVAL_MS, 2000, 10000);
    this.timer = setInterval(() => void this.tick(), intervalMs);
    this.timer.unref();
    void this.tick();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async tick(): Promise<{ claimed: number; attempted: number }> {
    if (this.running || !this.db.enabled) return { claimed: 0, attempted: 0 };
    this.running = true;
    try {
      const now = new Date().toISOString();
      const rows = await this.db.request<any[]>(
        `machine_connect_workflow_executions?status=eq.queued&available_at=lte.${encodeURIComponent(now)}&order=available_at.asc&limit=10`,
      );
      let attempted = 0;
      for (const row of rows) {
        if (!row?.id || !row?.organization_id) continue;
        attempted += 1;
        try {
          await this.workflows.runExecution(row.organization_id, row.id);
        } catch {
          // WorkflowService owns durable failure/retry state. One bad item must not
          // prevent the remaining bounded batch from being attempted.
        }
      }
      return { claimed: rows.length, attempted };
    } finally {
      this.running = false;
    }
  }

  private readPositiveInt(value: string | undefined, fallback: number, max: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), max) : fallback;
  }
}
