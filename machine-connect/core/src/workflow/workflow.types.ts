export type WorkflowTaskStatus = 'pending' | 'in_progress' | 'completed' | 'rejected' | 'cancelled';
export type WorkflowInstanceStatus = 'pending' | 'running' | 'completed' | 'rejected' | 'cancelled';
export type WorkflowExecutionStatus = 'queued' | 'leased' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface WorkflowTask { id:string; instanceId:string; tenantId:string; name:string; assigneeId?:string; status:WorkflowTaskStatus; createdAt:string; updatedAt:string; }
export interface WorkflowDefinition { id:string; tenantId:string; name:string; steps:{name:string;requiresApproval?:boolean}[]; createdBy:string; createdAt:string; }
export interface WorkflowInstance { id:string; workflowId:string; tenantId:string; requestedBy:string; status:WorkflowInstanceStatus; currentStep:number; createdAt:string; updatedAt:string; }
export interface WorkflowExecution { id:string; tenantId:string; ruleId:string; eventId:string; correlationId:string; idempotencyKey:string; status:WorkflowExecutionStatus; attempts:number; maxAttempts:number; availableAt:string; leaseUntil?:string; lastError?:string; createdAt:string; updatedAt:string; }
