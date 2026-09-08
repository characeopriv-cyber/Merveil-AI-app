export type RuleOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'exists';
export type RuleSafetyClass = 'read' | 'control' | 'critical';
export interface RuleCondition { field: string; operator: RuleOperator; value?: unknown; }
export type RuleAction =
  | { type: 'command'; capability: string; parameters?: Record<string, unknown>; safetyClass?: RuleSafetyClass }
  | { type: 'twin_patch'; state: Record<string, unknown> };
export interface OperationalEvent { id: string; tenantId: string; machineId?: string; eventType: string; source: string; occurredAt: string; correlationId: string; causationId?: string; schemaVersion: number; payload: Record<string, unknown>; }
export interface OperationalRule { id: string; tenantId: string; name: string; enabled: boolean; eventType: string; conditions: RuleCondition[]; cooldownSeconds: number; action?: RuleAction; lastTriggeredAt?: string; createdAt: string; }
export interface RuleEvaluationResult { ruleId: string; matched: boolean; reason?: string; actionId?: string; commandId?: string; executionId?: string; }
