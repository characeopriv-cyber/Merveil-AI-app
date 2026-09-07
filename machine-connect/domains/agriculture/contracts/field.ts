export interface FieldTelemetry {
  fieldId: string;
  observedAt: string;
  moisturePct?: number;
  temperatureC?: number;
  ph?: number;
  nutrientLevels?: Record<string, number>;
}

export interface CropHealthObservation {
  fieldId: string;
  source: 'sensor' | 'drone' | 'satellite';
  observedAt: string;
  vegetationHealthScore?: number;
  evidenceRef?: string;
}
