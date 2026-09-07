import { Injectable } from '@nestjs/common';
import { AutomationRule, RuleCondition } from './rule.types';

export interface RuleMatch { ruleId: string; tenantId: string; action: AutomationRule['action']; facts: Record<string, unknown>; }

@Injectable()
export class RuleEngineService {
  private readonly rules = new Map<string, AutomationRule>();

  register(rule: AutomationRule) { if (!rule.id || !rule.tenantId) throw new Error('Invalid rule'); this.rules.set(rule.id, Object.freeze({ ...rule })); return rule; }
  remove(tenantId: string, id: string) { const rule = this.rules.get(id); if (rule?.tenantId !== tenantId) throw new Error('Rule not found'); this.rules.delete(id); }
  list(tenantId: string) { return [...this.rules.values()].filter(r => r.tenantId === tenantId); }

  evaluate(tenantId: string, facts: Record<string, unknown>): RuleMatch[] {
    return this.list(tenantId).filter(r => r.enabled && this.triggerMatches(r, facts) && this.condition(r.condition, facts)).map(r => ({ ruleId: r.id, tenantId, action: r.action, facts }));
  }

  private triggerMatches(rule: AutomationRule, facts: Record<string, unknown>) {
    const source = String(facts.source ?? facts.topic ?? '');
    return (rule.trigger.type === 'telemetry' || rule.trigger.type === 'event') && (!rule.trigger.sourcePattern || this.topicMatches(rule.trigger.sourcePattern, source));
  }

  private topicMatches(pattern: string, value: string) {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\+/g, '[^/]+');
    return new RegExp(`^${escaped}$`).test(value);
  }

  private condition(c: RuleCondition, facts: Record<string, unknown>): boolean {
    if (c.all) return c.all.every(x => this.condition(x, facts));
    if (c.any) return c.any.some(x => this.condition(x, facts));
    if (c.not) return !this.condition(c.not, facts);
    if (!c.fact || !c.operator) return false;
    const actual = c.fact.split('.').reduce<any>((o, k) => o?.[k], facts);
    switch (c.operator) {
      case 'equal': return actual === c.value;
      case 'notEqual': return actual !== c.value;
      case 'greaterThan': return typeof actual === 'number' && actual > Number(c.value);
      case 'greaterThanOrEqual': return typeof actual === 'number' && actual >= Number(c.value);
      case 'lessThan': return typeof actual === 'number' && actual < Number(c.value);
      case 'lessThanOrEqual': return typeof actual === 'number' && actual <= Number(c.value);
      case 'contains': return typeof actual === 'string' && actual.includes(String(c.value));
      default: return false;
    }
  }
}
