export type RemediationStatus = 'requested' | 'approval_required' | 'approved' | 'running' | 'succeeded' | 'failed' | 'rejected' | 'expired';
export type RemediationAction = 'patch' | 'rotate_credential' | 'isolate' | 'restore_configuration' | 'restart_service' | 'retest';

export interface RemediationJob {
  id: string;
  tenantId: string;
  requestedBy: string;
  action: RemediationAction;
  targetId: string;
  reason: string;
  status: RemediationStatus;
  approvalRequired: boolean;
  approvedBy?: string;
  idempotencyKey: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  result?: Record<string, unknown>;
}
