export interface SatelliteTelemetry {
  satelliteId: string;
  observedAt: string;
  status: 'nominal' | 'degraded' | 'safe' | 'offline' | 'unknown';
  latitudeDeg?: number;
  longitudeDeg?: number;
  altitudeKm?: number;
  batteryPct?: number;
  payload?: Record<string, unknown>;
}

export interface SatelliteAnalysis {
  satelliteId: string;
  finding: string;
  confidence: number;
  evidenceRef?: string;
  commandable: false;
}
