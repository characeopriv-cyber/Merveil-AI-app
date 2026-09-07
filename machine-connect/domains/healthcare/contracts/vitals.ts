export interface VitalSignsSample {
  patientId: string;
  deviceId: string;
  observedAt: string;
  heartRateBpm?: number;
  oxygenSaturationPct?: number;
  temperatureC?: number;
  systolicMmHg?: number;
  diastolicMmHg?: number;
  quality: 'good' | 'fair' | 'poor' | 'unknown';
}

export interface ClinicalAlert {
  id: string;
  patientId: string;
  severity: 'info' | 'warning' | 'urgent';
  reason: string;
  observedAt: string;
  requiresHumanReview: true;
}
