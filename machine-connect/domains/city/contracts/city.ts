export interface TrafficObservation {
  sensorId: string;
  observedAt: string;
  vehicleCount?: number;
  averageSpeedKph?: number;
  occupancyPct?: number;
}

export interface PublicSafetyEvent {
  id: string;
  organizationId: string;
  type: 'accident' | 'fire' | 'medical' | 'infrastructure' | 'other';
  severity: 'info' | 'warning' | 'high' | 'critical';
  location: { latitude: number; longitude: number };
  observedAt: string;
  evidenceRef?: string;
}
