export interface EnergyReading {
  meterId: string;
  observedAt: string;
  powerKw?: number;
  energyKwh?: number;
  batterySocPct?: number;
  renewableKw?: number;
}

export interface EnergyRecommendation {
  meterId: string;
  action: 'observe' | 'shift_load' | 'charge' | 'discharge';
  rationale: string;
  confidence: number;
  requiresPolicyEvaluation: true;
}
