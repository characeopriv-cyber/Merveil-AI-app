export type WorkflowTaskStatus = 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
export type WorkflowInstanceStatus = 'pending' | 'running' | 'completed' | 'rejected' | 'cancelled';

export interface WorkflowTask {
  id: string;
  instanceId: string;
  tenantId: string;
  name: string;
  assigneeId?: string;
  status: WorkflowTaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowDefinition {
  id: string;
  tenantId: string;
  name: string;
  steps: { name: string; requiresApproval?: boolean }[];
  createdBy: string;
  createdAt: string;
}

export interface WorkflowInstance {
  id: string;
  workflowId: string;
  tenantId: string;
  requestedBy: string;
  status: WorkflowInstanceStatus;
  currentStep: number;
  createdAt: string;
  updatedAt: string;
}
