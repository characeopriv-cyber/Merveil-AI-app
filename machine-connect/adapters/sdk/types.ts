export type MachineProtocol =
  | 'mqtt' | 'websocket' | 'http' | 'opcua' | 'modbus'
  | 'can' | 'ble' | 'zigbee' | 'lorawan' | 'serial' | 'usb'
  | 'gpio' | 'sip' | 'satellite' | 'custom';

export type CapabilityKind = 'read' | 'actuate' | 'configure' | 'diagnose' | 'media';

export interface MachineCapability {
  id: string;
  kind: CapabilityKind;
  safetyClass: 'observe' | 'controlled' | 'critical';
  schema?: Record<string, unknown>;
}

export interface NormalizedTelemetry {
  machineId: string;
  observedAt: string;
  source: MachineProtocol;
  sequence?: number;
  values: Record<string, unknown>;
  raw?: unknown;
}

export interface CommandEnvelope {
  machineId: string;
  commandId: string;
  idempotencyKey: string;
  capability: string;
  parameters: Record<string, unknown>;
  requestedBy: string;
  expiresAt: string;
}

export interface MachineAdapter {
  readonly protocol: MachineProtocol;
  connect(config: Record<string, unknown>): Promise<void>;
  disconnect(): Promise<void>;
  describe(): Promise<{ manufacturer?: string; model?: string; firmware?: string }>;
  capabilities(): Promise<MachineCapability[]>;
  normalizeTelemetry(payload: unknown): NormalizedTelemetry;
  execute(command: CommandEnvelope): Promise<{ accepted: boolean; transportId?: string }>;
}
