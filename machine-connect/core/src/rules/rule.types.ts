export type RuleOperator = 'equal' | 'notEqual' | 'greaterThan' | 'greaterThanOrEqual' | 'lessThan' | 'lessThanOrEqual' | 'contains';
export type RuleActionType = 'command_request' | 'alert' | 'webhook';

export interface RuleCondition { fact?: string; operator?: RuleOperator; value?: unknown; all?: RuleCondition[]; any?: RuleCondition[]; not?: RuleCondition; }
export interface RuleTrigger { type: 'telemetry' | 'event'; sourcePattern?: string; }
export interface RuleAction { type: RuleActionType; capability?: string; payload?: Record<string, unknown>; url?: string; }
export interface AutomationRule { id: string; tenantId: string; name: string; enabled: boolean; trigger: RuleTrigger; condition: RuleCondition; action: RuleAction; }
