import { Injectable, OnModuleInit } from '@nestjs/common';
import { Adapter, AdapterContext } from './adapter';
import { AdapterRegistry } from './adapter-registry';

export type SimulatedCommand = {
  tenantId: string;
  machineId: string;
  capability: string;
  parameters: Record<string, unknown>;
  receivedAt: string;
};

/** Deterministic non-physical adapter for CI, development and integration tests. */
@Injectable()
export class ReferenceSimulatorAdapter implements Adapter, OnModuleInit {
  readonly id = 'reference-simulator';
  readonly protocol = 'simulator';
  private readonly commands: SimulatedCommand[] = [];

  constructor(private readonly registry: AdapterRegistry) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  async connect(_context: AdapterContext): Promise<void> {}
  async disconnect(_context: AdapterContext): Promise<void> {}
  async publishTelemetry(_context: AdapterContext, _payload: Record<string, unknown>): Promise<void> {}

  async dispatchCommand(context: AdapterContext, capability: string, parameters: Record<string, unknown>): Promise<void> {
    this.commands.push({ tenantId: context.tenantId, machineId: context.machineId, capability, parameters, receivedAt: new Date().toISOString() });
  }

  listCommands(): readonly SimulatedCommand[] { return [...this.commands]; }
  clear(): void { this.commands.length = 0; }
}
