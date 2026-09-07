export interface ForecastRequest {
  organizationId: string;
  metric: string;
  horizonDays: number;
  history: number[];
}

export interface ForecastResult {
  organizationId: string;
  metric: string;
  horizonDays: number;
  values: number[];
  generatedAt: string;
  requiresHumanReview: true;
}
