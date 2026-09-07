export interface CalderaCampaignRequest {
  id: string;
  tenantId: string;
  name: string;
  approvedBy?: string;
  expiresAt: string;
  targetRefs: string[];
  status: 'requested' | 'approved' | 'running' | 'completed' | 'failed' | 'expired';
}

export interface CalderaResult {
  campaignId: string;
  tenantId: string;
  status: 'completed' | 'failed';
  findings: Array<{ techniqueId?: string; title: string; severity: 'info' | 'low' | 'medium' | 'high'; evidence: Record<string, unknown> }>;
}
