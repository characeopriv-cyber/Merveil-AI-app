import { BadRequestException, Injectable } from '@nestjs/common';
import { MachineCommand } from '../domain/command';
import { SupabaseRest } from '../persistence/supabase-rest';
import { AdapterRegistry } from '../adapters/adapter-registry';

export interface CommandDispatchResult {
  commandId: string;
  status: 'dispatched' | 'failed';
  dispatchedAt: string;
  adapterId: string;
  error?: string;
}

@Injectable()
export class CommandDispatcherService {
  constructor(
    private readonly db: SupabaseRest,
    private readonly adapters: AdapterRegistry,
  ) {}

  /** Physical/protocol dispatch boundary. A command is marked dispatched only after the adapter accepts it. */
  async dispatch(command: MachineCommand, adapterId?: string): Promise<CommandDispatchResult> {
    if (!adapterId) throw new BadRequestException('adapterId is required for command dispatch');
    const adapter = this.adapters.get(adapterId);
    await adapter.dispatchCommand(
      { tenantId: command.tenantId, machineId: command.machineId },
      command.capability,
      command.parameters,
    );

    const dispatchedAt = new Date().toISOString();
    if (this.db.enabled) {
      await this.db.request(
        `machine_connect_commands?id=eq.${encodeURIComponent(command.commandId)}&organization_id=eq.${encodeURIComponent(command.tenantId)}`,
        { method: 'PATCH', body: JSON.stringify({ status: 'dispatched', dispatched_at: dispatchedAt, adapter_id: adapterId }) },
      );
    }

    return { commandId: command.commandId, status: 'dispatched', dispatchedAt, adapterId };
  }
}
