import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { SupabaseRest } from '../persistence/supabase-rest';
import { WorkflowService } from './workflow.service';

/** Autonomous bounded worker. Durable claims and lease recovery remain authoritative in WorkflowService. */
@Injectable()
export class ExecutionWorkerService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private running = false;
  private ticks = 0;
  private recovered = 0;
  private attempted = 0;
  private completed = 0;
  private failed = 0;
  private lastTickAt?: string;
  private lastError?: string;

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

  health() {
    return {
      enabled: this.db.enabled,
      running: this.running,
      ticks: this.ticks,
      recovered: this.recovered,
      attempted: this.attempted,
      completed: this.completed,
      failed: this.failed,
      lastTickAt: this.lastTickAt,
      lastError: this.lastError,
    };
  }

  async tick(): Promise<{ recovered: number; claimed: number; attempted: number }> {
    if (this.running || !this.db.enabled) return { recovered: 0, claimed: 0, attempted: 0 };
    this.running = true;
    this.ticks += 1;
    this.lastTickAt = new Date().toISOString();
    try {
      const recovered = await this.workflows.recoverExpiredExecutions(50);
      this.recovered += recovered;
      const now = new Date().toISOString();
      const rows = await this.db.request<any[]>(
        `machine_connect_workflow_executions?status=eq.queued&available_at=lte.${encodeURIComponent(now)}&order=available_at.asc&limit=10`,
      );
      let attempted = 0;
      for (const row of rows) {
        if (!row?.id || !row?.organization_id) continue;
        attempted += 1;
        this.attempted += 1;
        try {
          const result = await this.workflows.runExecution(row.organization_id, row.id);
          if (result.status === 'completed') this.completed += 1;
          if (result.status === 'failed') this.failed += 1;
        } catch (error) {
          this.lastError = error instanceof Error ? error.message.slice(0, 500) : 'worker execution failed';
          // WorkflowService owns durable failure/retry state. One item cannot stop the batch.
        }
      }
      return { recovered, claimed: rows.length, attempted };
    } catch (error) {
      this.lastError = error instanceof Error ? error.message.slice(0, 500) : 'worker tick failed';
      throw error;
    } finally {
      this.running = false;
    }
  }

  private readPositiveInt(value: string | undefined, fallback: number, max: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), max) : fallback;
  }
}
