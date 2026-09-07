export interface EnvironmentalReading {
  sensorId: string;
  observedAt: string;
  latitude?: number;
  longitude?: number;
  pm25UgM3?: number;
  pm10UgM3?: number;
  temperatureC?: number;
  humidityPct?: number;
  ph?: number;
  turbidityNtu?: number;
}

export interface EnvironmentalAnalysis {
  sensorId: string;
  metric: string;
  status: 'normal' | 'elevated' | 'critical' | 'unknown';
  confidence: number;
  evidenceRef?: string;
}
