import { RuleEngineService } from './rule-engine.service';

describe('RuleEngineService', () => {
  it('matches nested all conditions', () => {
    const engine = new RuleEngineService();
    engine.register({ id: 'r1', tenantId: 't1', name: 'overheat', enabled: true, trigger: { type: 'telemetry', sourcePattern: 'devices/+/telemetry' }, condition: { all: [ { fact: 'payload.type', operator: 'equal', value: 'coffee_maker' }, { fact: 'payload.temperature', operator: 'greaterThan', value: 95 } ] }, action: { type: 'command_request', capability: 'power_off' } });
    expect(engine.evaluate('t1', { source: 'devices/m1/telemetry', payload: { type: 'coffee_maker', temperature: 100 } })).toHaveLength(1);
    expect(engine.evaluate('t2', { source: 'devices/m1/telemetry', payload: { type: 'coffee_maker', temperature: 100 } })).toHaveLength(0);
  });
});
