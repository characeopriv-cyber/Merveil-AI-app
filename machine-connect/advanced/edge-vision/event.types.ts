export interface EdgeVisionEvent {
  organizationId: string;
  cameraId: string;
  type: 'traffic' | 'accident' | 'infrastructure' | 'unknown';
  observedAt: string;
  confidence: number;
  evidenceRef?: string;
  location?: { latitude: number; longitude: number };
  requiresHumanReview: true;
}

export function validateVisionEvent(event: EdgeVisionEvent): EdgeVisionEvent {
  if (event.confidence < 0 || event.confidence > 1) throw new Error('confidence must be between 0 and 1');
  return event;
}
