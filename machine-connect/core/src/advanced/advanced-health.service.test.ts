import assert from 'node:assert/strict';
import test from 'node:test';
import { AdvancedHealthService } from './advanced-health.service';

test('advanced health reports every module without claiming external workers are live', () => {
  const snapshot = new AdvancedHealthService().snapshot();
  assert.equal(snapshot.status, 'ok');
  assert.equal(snapshot.modules.formGenAI, 'ready');
  assert.equal(snapshot.modules.landChain, 'boundary');
  assert.equal(snapshot.modules.fedLearn, 'boundary');
  assert.equal(snapshot.modules.twinSim, 'boundary');
  assert.equal(snapshot.modules.citizenBot, 'boundary');
  assert.equal(snapshot.modules.govPredict, 'boundary');
  assert.equal(snapshot.modules.smpc, 'boundary');
  assert.equal(snapshot.modules.edgeVision, 'boundary');
  assert.equal(snapshot.modules.voteChain, 'boundary');
  assert.equal(snapshot.modules.secureAggregation, 'boundary');
});
