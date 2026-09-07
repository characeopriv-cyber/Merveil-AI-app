export interface CitizenAssistantRequest {
  organizationId: string;
  citizenId?: string;
  message: string;
  locale?: string;
}

export interface CitizenAssistantResponse {
  answer: string;
  suggestedServiceIds: string[];
  requiresHumanReview: boolean;
}

export interface ForecastRequest {
  organizationId: string;
  seriesId: string;
  horizon: number;
  values: Array<{ observedAt: string; value: number }>;
}

export interface ForecastResult {
  seriesId: string;
  horizon: number;
  predictions: number[];
  confidence: number;
  modelRef?: string;
}

export interface SecureAggregateRequest {
  organizationId: string;
  computationId: string;
  participantCount: number;
  aggregateType: 'sum' | 'count' | 'mean';
  resultRef: string;
}

export interface EdgeVisionObservation {
  deviceId: string;
  observedAt: string;
  modelRef: string;
  labels: Array<{ label: string; confidence: number }>;
  evidenceRef?: string;
  actionAllowed: false;
}

export interface CivicVoteReceipt {
  pollId: string;
  commitment: string;
  receipt: string;
  choiceRevealed: false;
}
