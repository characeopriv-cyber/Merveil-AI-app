export interface AdapterContext {
  tenantId: string;
  machineId: string;
}

export interface Adapter {
  readonly id: string;
  readonly protocol: string;
  connect(context: AdapterContext): Promise<void>;
  disconnect(context: AdapterContext): Promise<void>;
  publishTelemetry(context: AdapterContext, payload: Record<string, unknown>): Promise<void>;
  dispatchCommand(context: AdapterContext, capability: string, parameters: Record<string, unknown>): Promise<void>;
}
