export type ServiceRequestStatus = 'submitted' | 'in_review' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';

export interface ServiceRequest {
  id: string;
  tenantId: string;
  requesterId: string;
  title: string;
  category: string;
  payload: Record<string, unknown>;
  status: ServiceRequestStatus;
  workflowInstanceId?: string;
  idempotencyKey: string;
  createdAt: string;
  updatedAt: string;
}
