import { BadRequestException, Injectable } from '@nestjs/common';
import { MachineCommand } from '../domain/command';
import { SupabaseRest } from '../persistence/supabase-rest';
import { AdapterRegistry } from '../adapters/adapter-registry';

const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 3;

export interface CommandDispatchResult {
  commandId: string;
  status: 'dispatched' | 'failed';
  dispatchedAt: string;
  adapterId: string;
  attemptCount: number;
  timeoutAt: string;
  error?: string;
}

@Injectable()
export class CommandDispatcherService {
  constructor(
    private readonly db: SupabaseRest,
    private readonly adapters: AdapterRegistry,
  ) {}

  /** Physical/protocol dispatch boundary. Persistence follows successful adapter acceptance. */
  async dispatch(command: MachineCommand, adapterId?: string): Promise<CommandDispatchResult> {
    if (!adapterId) throw new BadRequestException('adapterId is required for command dispatch');
    const adapter = this.adapters.get(adapterId);
    const attemptCount = Math.min(MAX_ATTEMPTS, ((command as MachineCommand & { attemptCount?: number }).attemptCount ?? 0) + 1);
    if (attemptCount > MAX_ATTEMPTS) throw new BadRequestException('Maximum command delivery attempts exceeded');

    try {
      await adapter.dispatchCommand(
        { tenantId: command.tenantId, machineId: command.machineId },
        command.capability,
        command.parameters,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (this.db.enabled) {
        await this.db.request(
          `machine_connect_commands?id=eq.${encodeURIComponent(command.commandId)}&organization_id=eq.${encodeURIComponent(command.tenantId)}`,
          { method: 'PATCH', body: JSON.stringify({ attempt_count: attemptCount, last_error: message, status: 'failed' }) },
        );
      }
      return { commandId: command.commandId, status: 'failed', dispatchedAt: new Date().toISOString(), adapterId, attemptCount, timeoutAt: new Date(Date.now() + DEFAULT_TIMEOUT_MS).toISOString(), error: message };
    }

    const dispatchedAt = new Date().toISOString();
    const timeoutAt = new Date(Date.now() + DEFAULT_TIMEOUT_MS).toISOString();
    if (this.db.enabled) {
      await this.db.request(
        `machine_connect_commands?id=eq.${encodeURIComponent(command.commandId)}&organization_id=eq.${encodeURIComponent(command.tenantId)}`,
        { method: 'PATCH', body: JSON.stringify({ status: 'dispatched', dispatched_at: dispatchedAt, timeout_at: timeoutAt, attempt_count: attemptCount, max_attempts: MAX_ATTEMPTS, next_retry_at: null, last_error: null, adapter_id: adapterId }) },
      );
    }

    return { commandId: command.commandId, status: 'dispatched', dispatchedAt, adapterId, attemptCount, timeoutAt };
  }
}
