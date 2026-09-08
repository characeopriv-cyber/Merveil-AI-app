import { BadRequestException, Injectable, Inject, forwardRef } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SupabaseRest } from '../persistence/supabase-rest';
import { MachineService } from '../machine/machine.service';
import { WorkflowService } from '../workflow/workflow.service';
import { OperationalEvent, OperationalRule, RuleCondition, RuleEvaluationResult, RuleOperator } from './operations.types';

@Injectable()
export class OperationsService {
  private readonly events = new Map<string, OperationalEvent>();
  private readonly rules = new Map<string, OperationalRule>();
  private readonly triggered = new Map<string, number>();

  constructor(
    private readonly db: SupabaseRest,
    private readonly machines: MachineService,
    @Inject(forwardRef(() => WorkflowService)) private readonly workflows: WorkflowService,
  ) {}

  async publish(input: Omit<OperationalEvent, 'id' | 'correlationId'> & { correlationId?: string; causationId?: string }): Promise<OperationalEvent> {
    if (!input.tenantId || !input.eventType || !input.source) throw new BadRequestException('tenant, eventType and source are required');
    if (input.machineId) await this.machines.get(input.tenantId, input.machineId);
    const event: OperationalEvent = {
      ...input,
      id: randomUUID(),
      correlationId: input.correlationId ?? randomUUID(),
      schemaVersion: input.schemaVersion || 1,
      occurredAt: new Date(input.occurredAt || new Date().toISOString()).toISOString(),
      payload: input.payload ?? {},
    };
    const duplicateKey = `${event.tenantId}:${event.machineId ?? ''}:${event.eventType}:${event.causationId ?? event.id}`;
    if (this.events.has(duplicateKey)) return this.events.get(duplicateKey)!;
    if (this.db.enabled) {
      await this.db.request('machine_connect_operational_events', {
        method: 'POST',
        body: JSON.stringify({ id: event.id, organization_id: event.tenantId, machine_id: event.machineId ?? null, event_type: event.eventType, source: event.source, occurred_at: event.occurredAt, correlation_id: event.correlationId, causation_id: event.causationId ?? null, schema_version: event.schemaVersion, payload: event.payload }),
      });
    }
    this.events.set(duplicateKey, event);
    await this.evaluate(event);
    return event;
  }

  async createRule(input: { tenantId: string; name: string; eventType: string; conditions: RuleCondition[]; enabled?: boolean; cooldownSeconds?: number; action?: OperationalRule['action'] }): Promise<OperationalRule> {
    if (!input.tenantId || !input.name || !input.eventType) throw new BadRequestException('tenant, name and eventType are required');
    this.validateConditions(input.conditions);
    this.validateAction(input.action);
    const rule: OperationalRule = { id: randomUUID(), tenantId: input.tenantId, name: input.name.trim().slice(0, 160), enabled: input.enabled !== false, eventType: input.eventType.trim().slice(0, 120), conditions: input.conditions, cooldownSeconds: Math.max(0, Math.min(86400, Math.floor(input.cooldownSeconds ?? 0))), action: input.action, createdAt: new Date().toISOString() };
    if (this.db.enabled) await this.db.request('machine_connect_operational_rules', { method: 'POST', body: JSON.stringify({ id: rule.id, organization_id: rule.tenantId, name: rule.name, enabled: rule.enabled, event_type: rule.eventType, conditions: rule.conditions, cooldown_seconds: rule.cooldownSeconds, action: rule.action ?? null, created_at: rule.createdAt }) });
    this.rules.set(`${rule.tenantId}:${rule.id}`, rule);
    return rule;
  }

  async evaluate(event: OperationalEvent): Promise<RuleEvaluationResult[]> {
    const candidates = this.db.enabled ? await this.loadRules(event.tenantId, event.eventType) : [...this.rules.values()].filter(r => r.tenantId === event.tenantId && r.eventType === event.eventType);
    const results: RuleEvaluationResult[] = [];
    for (const rule of candidates) {
      if (!rule.enabled) { results.push({ ruleId: rule.id, matched: false, reason: 'disabled' }); continue; }
      const last = this.triggered.get(`${event.tenantId}:${rule.id}`) ?? 0;
      if (Date.now() - last < rule.cooldownSeconds * 1000) { results.push({ ruleId: rule.id, matched: false, reason: 'cooldown' }); continue; }
      const matched = rule.conditions.every(c => this.matches(event.payload, c));
      const result: RuleEvaluationResult = { ruleId: rule.id, matched };
      if (matched) {
        if (!rule.action) { results.push({ ...result, reason: 'matched_no_action' }); continue; }
        if (!event.machineId) { results.push({ ...result, reason: 'matched_requires_machine' }); continue; }
        try {
          const execution = await this.workflows.enqueueExecution({ tenantId: event.tenantId, rule, event });
          this.triggered.set(`${event.tenantId}:${rule.id}`, Date.now());
          result.executionId = execution.id;
          result.reason = 'queued';
          if (this.db.enabled) await this.db.request('machine_connect_operational_rule_runs', { method: 'POST', body: JSON.stringify({ id: randomUUID(), organization_id: event.tenantId, rule_id: rule.id, event_id: event.id, correlation_id: event.correlationId, execution_id: execution.id, status: 'queued', created_at: new Date().toISOString() }) });
        } catch (error) {
          result.reason = error instanceof Error ? `queue_failed:${error.message}` : 'queue_failed';
          if (this.db.enabled) await this.db.request('machine_connect_operational_rule_runs', { method: 'POST', body: JSON.stringify({ id: randomUUID(), organization_id: event.tenantId, rule_id: rule.id, event_id: event.id, correlation_id: event.correlationId, status: 'failed', created_at: new Date().toISOString() }) });
        }
      }
      results.push(result);
    }
    return results;
  }

  private async loadRules(tenantId: string, eventType: string): Promise<OperationalRule[]> {
    const rows = await this.db.request<any[]>(`machine_connect_operational_rules?organization_id=eq.${encodeURIComponent(tenantId)}&event_type=eq.${encodeURIComponent(eventType)}&limit=100`);
    return rows.map(r => ({ id: r.id, tenantId: r.organization_id, name: r.name, enabled: r.enabled, eventType: r.event_type, conditions: r.conditions ?? [], cooldownSeconds: Number(r.cooldown_seconds ?? 0), action: r.action ?? undefined, lastTriggeredAt: r.last_triggered_at, createdAt: r.created_at }));
  }
  private matches(payload: Record<string, unknown>, condition: RuleCondition): boolean { const actual = this.resolve(payload, condition.field); const expected = condition.value; switch (condition.operator) { case 'exists': return actual !== undefined && actual !== null; case 'eq': return actual === expected; case 'neq': return actual !== expected; case 'gt': return typeof actual === 'number' && typeof expected === 'number' && actual > expected; case 'gte': return typeof actual === 'number' && typeof expected === 'number' && actual >= expected; case 'lt': return typeof actual === 'number' && typeof expected === 'number' && actual < expected; case 'lte': return typeof actual === 'number' && typeof expected === 'number' && actual <= expected; case 'contains': return Array.isArray(actual) ? actual.includes(expected) : typeof actual === 'string' && typeof expected === 'string' && actual.includes(expected); default: return false; } }
  private resolve(payload: Record<string, unknown>, path: string): unknown { return path.split('.').reduce<unknown>((value, key) => value && typeof value === 'object' ? (value as Record<string, unknown>)[key] : undefined, payload); }
  private validateConditions(conditions: RuleCondition[]): void { if (!Array.isArray(conditions) || conditions.length > 20) throw new BadRequestException('conditions must contain 0-20 entries'); const operators: RuleOperator[] = ['eq','neq','gt','gte','lt','lte','contains','exists']; for (const condition of conditions) { if (!condition || typeof condition.field !== 'string' || condition.field.length < 1 || condition.field.length > 160) throw new BadRequestException('invalid rule field'); if (!operators.includes(condition.operator)) throw new BadRequestException('invalid rule operator'); } }
  private validateAction(action: OperationalRule['action']): void { if (!action) return; if (action.type === 'command') { if (!action.capability || action.capability.length > 160) throw new BadRequestException('invalid command capability'); if (action.parameters && (typeof action.parameters !== 'object' || Array.isArray(action.parameters) || Object.keys(action.parameters).length > 50)) throw new BadRequestException('invalid command parameters'); return; } if (action.type === 'twin_patch') { if (!action.state || typeof action.state !== 'object' || Array.isArray(action.state) || Object.keys(action.state).length > 50) throw new BadRequestException('invalid twin patch'); return; } throw new BadRequestException('unsupported rule action'); }
}
