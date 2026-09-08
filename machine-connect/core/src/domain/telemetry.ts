export type TelemetryQuality = 'good' | 'degraded' | 'bad' | 'unknown';

export interface TelemetryEnvelope {
  id: string;
  tenantId: string;
  machineId: string;
  source: string;
  schemaVersion: number;
  sequence?: number;
  observedAt: string;
  receivedAt: string;
  quality: TelemetryQuality;
  data: unknown;
}
