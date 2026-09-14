/**
 * Evaluation is deliberately provider-agnostic. A result can only become
 * "verified" when an evaluator supplies evidence; provider success alone is
 * not a quality claim.
 */
export type QualityDimension = 'continuity' | 'style' | 'audio_sync' | 'completeness' | 'safety' | 'technical';

export type Evaluation = {
  assetId: string;
  verified: boolean;
  scores: Partial<Record<QualityDimension, number>>;
  issues: Array<{ dimension: QualityDimension; severity: 'blocker' | 'warning' | 'info'; message: string }>;
  evaluatedAt: string;
};

export function isPublishable(e: Evaluation): boolean {
  return e.verified && !e.issues.some(i => i.severity === 'blocker');
}

export function aggregateScore(e: Evaluation): number {
  const values = Object.values(e.scores).filter((v): v is number => typeof v === 'number');
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}
