import { Injectable } from '@nestjs/common';
import { Adapter, AdapterContext } from './adapter';

export type SimulatedCommand = {
  tenantId: string;
  machineId: string;
  capability: string;
  parameters: Record<string, unknown>;
  receivedAt: string;
};

/**
 * Deterministic non-physical adapter used for CI, development and integration tests.
 * It never claims to control a real device.
 */
@Injectable()
export class ReferenceSimulatorAdapter implements Adapter {
  readonly id = 'reference-simulator';
  readonly protocol = 'simulator';
  private readonly commands: SimulatedCommand[] = [];

  async connect(_context: AdapterContext): Promise<void> {}
  async disconnect(_context: AdapterContext): Promise<void> {}
  async publishTelemetry(_context: AdapterContext, _payload: Record<string, unknown>): Promise<void> {}

  async dispatchCommand(context: AdapterContext, capability: string, parameters: Record<string, unknown>): Promise<void> {
    this.commands.push({
      tenantId: context.tenantId,
      machineId: context.machineId,
      capability,
      parameters,
      receivedAt: new Date().toISOString(),
    });
  }

  listCommands(): readonly SimulatedCommand[] {
    return [...this.commands];
  }

  clear(): void {
    this.commands.length = 0;
  }
}
