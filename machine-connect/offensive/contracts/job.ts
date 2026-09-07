export type OffensiveScanType = 'network' | 'web' | 'api' | 'cloud';
export type OffensiveMode = 'discovery' | 'assessment' | 'validation';

export interface OffensiveTarget {
  value: string;
  kind: 'ip' | 'cidr' | 'hostname' | 'url';
}

export interface OffensiveJob {
  id: string;
  tenantId: string;
  scanType: OffensiveScanType;
  mode: OffensiveMode;
  targets: OffensiveTarget[];
  approvedBy?: string;
  approvedAt?: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
}

export interface OffensiveJobRequest {
  tenantId: string;
  scanType: OffensiveScanType;
  mode: OffensiveMode;
  targets: OffensiveTarget[];
  createdBy: string;
}
