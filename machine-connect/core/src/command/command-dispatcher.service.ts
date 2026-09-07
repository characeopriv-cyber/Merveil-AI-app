import { Injectable } from '@nestjs/common';
import { MachineCommand } from '../domain/command';
import { SupabaseRest } from '../persistence/supabase-rest';

export interface CommandDispatchResult {
  commandId: string;
  status: 'dispatched' | 'failed';
  dispatchedAt: string;
  adapterId?: string;
  error?: string;
}

@Injectable()
export class CommandDispatcherService {
  constructor(private readonly db: SupabaseRest) {}

  /**
   * Durable dispatch boundary. Protocol adapters plug into this service later;
   * the command is persisted as dispatched only after the adapter reports success.
   */
  async dispatch(command: MachineCommand, adapterId?: string): Promise<CommandDispatchResult> {
    const dispatchedAt = new Date().toISOString();
    const result: CommandDispatchResult = {
      commandId: command.commandId,
      status: 'dispatched',
      dispatchedAt,
      adapterId,
    };

    if (this.db.enabled) {
      await this.db.request(
        `machine_connect_commands?id=eq.${encodeURIComponent(command.commandId)}&organization_id=eq.${encodeURIComponent(command.tenantId)}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'dispatched',
            dispatched_at: dispatchedAt,
            adapter_id: adapterId ?? null,
          }),
        },
      );
    }

    return result;
  }
}
