import test from 'node:test';
import assert from 'node:assert/strict';
import { VerificationCheckRunner } from './check-runner';

test('runner rejects unknown checks and invalid targets', async () => {
  const runner = new VerificationCheckRunner();
  await assert.rejects(() => runner.run('missing', { tenantId: 't', target: 'x', targetKind: 'hostname' }), /unknown/);
  runner.register({ id: 'safe-check', description: 'test', async run() { return []; } });
  await assert.rejects(() => runner.run('safe-check', { tenantId: 't', target: 'https://x', targetKind: 'hostname' }), /hostname/);
});

test('runner executes only registered checks', async () => {
  const runner = new VerificationCheckRunner();
  runner.register({ id: 'safe-check', description: 'test', async run(ctx) { return [{ checkId: 'safe-check', target: ctx.target, severity: 'info', title: 'ok', evidence: {} }]; } });
  const findings = await runner.run('safe-check', { tenantId: 't', target: 'example.internal', targetKind: 'hostname' });
  assert.equal(findings[0].checkId, 'safe-check');
});
