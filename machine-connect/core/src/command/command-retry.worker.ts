import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { CommandDispatcherService } from './command-dispatcher.service';
import { EmergencyStopService } from '../safety/emergency-stop.service';
import { SupabaseRest } from '../persistence/supabase-rest';
import { MachineCommand } from '../domain/command';

const INTERVAL_MS = 2_000;
const BACKOFF_MS = [1_000, 2_000, 4_000];

type RetryRow = {
  id: string;
  organization_id: string;
  machine_id: string;
  action: string;
  parameters: Record<string, unknown>;
  requested_by: string;
  created_at: string;
  idempotency_key: string;
  status: string;
  attempt_count: number;
  max_attempts: number;
  adapter_id?: string | null;
  timeout_at?: string | null;
};

@Injectable()
export class CommandRetryWorker implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly db: SupabaseRest,
    private readonly dispatcher: CommandDispatcherService,
    private readonly emergencyStop: EmergencyStopService,
  ) {}

  onModuleInit(): void {
    if (this.db.enabled) {
      this.timer = setInterval(() => void this.tick(), INTERVAL_MS);
      void this.tick();
    }
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick(): Promise<void> {
    if (this.running || !this.db.enabled) return;
    this.running = true;
    try {
      const now = new Date().toISOString();
      const rows = await this.db.request<RetryRow[]>(
        `machine_connect_commands?status=eq.dispatched&timeout_at=lte.${encodeURIComponent(now)}&retry_claimed_at=is.null&order=timeout_at.asc&limit=25`,
      );

      for (const row of rows) await this.process(row);
    } catch {
      // Worker errors must not terminate the process; the next tick retries discovery.
    } finally {
      this.running = false;
    }
  }

  private async process(row: RetryRow): Promise<void> {
    const claimTime = new Date().toISOString();
    const claimed = await this.db.request<RetryRow[]>(
      `machine_connect_commands?id=eq.${encodeURIComponent(row.id)}&organization_id=eq.${encodeURIComponent(row.organization_id)}&status=eq.dispatched&retry_claimed_at=is.null`,
      { method: 'PATCH', body: JSON.stringify({ retry_claimed_at: claimTime }) },
    );
    if (!claimed.length) return;

    if (this.emergencyStop.isStopped(row.organization_id, row.machine_id)) {
      await this.fail(row, 'Emergency stop active during retry');
      return;
    }

    if (row.attempt_count >= row.max_attempts) {
      await this.timeout(row);
      return;
    }

    const delay = BACKOFF_MS[Math.min(row.attempt_count, BACKOFF_MS.length - 1)];
    if (delay > 0 && row.attempt_count > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    const command: MachineCommand = {
      commandId: row.id,
      tenantId: row.organization_id,
      machineId: row.machine_id,
      capability: row.action,
      parameters: row.parameters ?? {},
      requestedBy: row.requested_by,
      requestedAt: row.created_at,
      idempotencyKey: row.idempotency_key,
      status: 'dispatched',
      ...(row.attempt_count != null ? { attemptCount: row.attempt_count } : {}),
      ...(row.adapter_id ? { adapterId: row.adapter_id } : {}),
    } as MachineCommand;

    const result = await this.dispatcher.dispatch(command, row.adapter_id ?? undefined);
    if (result.status === 'dispatched') {
      await this.event(row, 'command.retry_dispatched', { attemptCount: result.attemptCount, adapterId: result.adapterId, timeoutAt: result.timeoutAt });
      await this.db.request(`machine_connect_commands?id=eq.${encodeURIComponent(row.id)}&organization_id=eq.${encodeURIComponent(row.organization_id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ retry_claimed_at: null }),
      });
      return;
    }

    if (result.attemptCount >= row.max_attempts) await this.timeout(row, result.error);
    else await this.fail(row, result.error ?? 'Retry dispatch failed');
  }

  private async timeout(row: RetryRow, error?: string): Promise<void> {
    await this.db.request(`machine_connect_commands?id=eq.${encodeURIComponent(row.id)}&organization_id=eq.${encodeURIComponent(row.organization_id)}&status=eq.dispatched`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'timed_out', timeout_at: new Date().toISOString(), retry_claimed_at: null, last_error: error ?? 'Command delivery timed out' }),
    });
    await this.event(row, 'command.timed_out', { attemptCount: row.attempt_count, error: error ?? 'Command delivery timed out' });
  }

  private async fail(row: RetryRow, error: string): Promise<void> {
    await this.db.request(`machine_connect_commands?id=eq.${encodeURIComponent(row.id)}&organization_id=eq.${encodeURIComponent(row.organization_id)}&status=eq.dispatched`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'failed', retry_claimed_at: null, last_error: error }),
    });
    await this.event(row, 'command.retry_failed', { attemptCount: row.attempt_count, error });
  }

  private async event(row: RetryRow, eventType: string, payload: Record<string, unknown>): Promise<void> {
    await this.db.request('machine_connect_events', {
      method: 'POST',
      body: JSON.stringify({
        id: crypto.randomUUID(),
        organization_id: row.organization_id,
        machine_id: row.machine_id,
        event_type: eventType,
        actor_id: row.requested_by,
        payload: { commandId: row.id, ...payload },
      }),
    });
  }
}
