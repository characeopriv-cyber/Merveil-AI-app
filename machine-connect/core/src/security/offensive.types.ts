export type OffensiveScanType = 'network' | 'web' | 'api' | 'cloud';
export type OffensiveJobMode = 'discovery' | 'assessment' | 'validation';
export type OffensiveJobStatus = 'requested' | 'approved' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface AuthorizedTarget {
  target: string;
  targetType: 'ip' | 'cidr' | 'domain' | 'url' | 'cloud-account';
}

export interface OffensiveSecurityJob {
  id: string;
  tenantId: string;
  requestedBy: string;
  name: string;
  scanType: OffensiveScanType;
  mode: OffensiveJobMode;
  targets: AuthorizedTarget[];
  status: OffensiveJobStatus;
  approvalRequired: boolean;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OffensiveFinding {
  id: string;
  jobId: string;
  tenantId: string;
  target: string;
  scanner: string;
  findingId?: string;
  title: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  evidence: Record<string, unknown>;
  remediation?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'false_positive';
}
