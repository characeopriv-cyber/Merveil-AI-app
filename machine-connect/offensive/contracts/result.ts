export type FindingSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface OffensiveFinding {
  id: string;
  jobId: string;
  tenantId: string;
  target: string;
  scanner: string;
  findingId?: string;
  title: string;
  severity: FindingSeverity;
  evidence: Record<string, unknown>;
  remediation?: string;
  observedAt: string;
}

export interface OffensiveJobResult {
  jobId: string;
  tenantId: string;
  status: 'completed' | 'failed' | 'cancelled';
  findings: OffensiveFinding[];
  completedAt: string;
  summary: Record<string, number>;
}
