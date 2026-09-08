export type TwinState = 'synchronized' | 'stale' | 'conflict' | 'unknown';

export interface DeviceTwin {
  id: string;
  tenantId: string;
  machineId: string;
  twinType: string;
  observedAt: string;
  state: Record<string, unknown>;
  simulation?: Record<string, unknown>;
  twinState: TwinState;
  version: number;
  createdAt: string;
}

export interface TwinReconcileInput {
  tenantId: string;
  machineId: string;
  reportedState: Record<string, unknown>;
  observedAt?: string;
  source?: string;
  expectedVersion?: number;
}
