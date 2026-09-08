import test from 'node:test';
import assert from 'node:assert/strict';
import { RuleEngineService } from './rule-engine.service';

test('RuleEngineService matches nested all conditions and isolates tenants', () => {
  const engine = new RuleEngineService();
  engine.register({ id: 'r1', tenantId: 't1', name: 'overheat', enabled: true, trigger: { type: 'telemetry', sourcePattern: 'devices/+/telemetry' }, condition: { all: [ { fact: 'payload.type', operator: 'equal', value: 'coffee_maker' }, { fact: 'payload.temperature', operator: 'greaterThan', value: 95 } ] }, action: { type: 'command_request', capability: 'power_off' } });
  assert.equal(engine.evaluate('t1', { source: 'devices/m1/telemetry', payload: { type: 'coffee_maker', temperature: 100 } }).length, 1);
  assert.equal(engine.evaluate('t2', { source: 'devices/m1/telemetry', payload: { type: 'coffee_maker', temperature: 100 } }).length, 0);
});
