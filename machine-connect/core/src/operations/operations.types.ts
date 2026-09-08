export type RuleOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'exists';

export interface RuleCondition {
  field: string;
  operator: RuleOperator;
  value?: unknown;
}

export interface OperationalEvent {
  id: string;
  tenantId: string;
  machineId?: string;
  eventType: string;
  source: string;
  occurredAt: string;
  correlationId: string;
  causationId?: string;
  schemaVersion: number;
  payload: Record<string, unknown>;
}

export interface OperationalRule {
  id: string;
  tenantId: string;
  name: string;
  enabled: boolean;
  eventType: string;
  conditions: RuleCondition[];
  cooldownSeconds: number;
  lastTriggeredAt?: string;
  createdAt: string;
}

export interface RuleEvaluationResult {
  ruleId: string;
  matched: boolean;
  reason?: string;
}
