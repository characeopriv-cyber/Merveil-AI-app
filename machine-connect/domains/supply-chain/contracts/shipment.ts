export interface ShipmentObservation {
  shipmentId: string;
  observedAt: string;
  latitude?: number;
  longitude?: number;
  temperatureC?: number;
  humidityPct?: number;
  status?: 'planned' | 'in_transit' | 'delivered' | 'exception';
}

export interface ProvenanceRecord {
  shipmentId: string;
  eventHash: string;
  observedAt: string;
  externalAnchorRef?: string;
}
