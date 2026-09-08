import assert from 'node:assert/strict';
import test from 'node:test';
import { ExecutionWorkerService } from './execution-worker.service';

test('worker processes only bounded queued executions', async () => {
  const calls: string[] = [];
  const db = {
    enabled: true,
    async request(path: string) {
      if (path.includes('status=in.')) return [];
      return [{ id: 'e1', organization_id: 't1' }, { id: 'e2', organization_id: 't2' }, { id: 'e3', organization_id: 't3' }];
    },
  } as any;
  const workflows = {
    async recoverExpiredExecutions() { return 0; },
    async runExecution(tenantId: string, executionId: string) { calls.push(`${tenantId}:${executionId}`); },
  } as any;
  const worker = new ExecutionWorkerService(db, workflows);
  const result = await worker.tick();
  assert.deepEqual(result, { recovered: 0, claimed: 3, attempted: 3 });
  assert.deepEqual(calls, ['t1:e1', 't2:e2', 't3:e3']);
  assert.equal(worker.health().attempted, 3);
});

test('worker prevents overlapping ticks', async () => {
  let resolve: (() => void) | undefined;
  const db = { enabled: true, async request() { await new Promise<void>(r => { resolve = r; }); return []; } } as any;
  const workflows = { recoverExpiredExecutions: async () => 0 } as any;
  const worker = new ExecutionWorkerService(db, workflows);
  const first = worker.tick();
  const second = await worker.tick();
  assert.deepEqual(second, { recovered: 0, claimed: 0, attempted: 0 });
  resolve?.();
  assert.deepEqual(await first, { recovered: 0, claimed: 0, attempted: 0 });
});

test('worker recovers expired leases before polling new work', async () => {
  const db = { enabled: true, async request() { return []; } } as any;
  const workflows = { recoverExpiredExecutions: async () => 2, runExecution: async () => {} } as any;
  const worker = new ExecutionWorkerService(db, workflows);
  const result = await worker.tick();
  assert.equal(result.recovered, 2);
  assert.equal(result.claimed, 0);
  assert.equal(worker.health().recovered, 2);
});

test('worker isolates one execution failure and records health error', async () => {
  const db = { enabled: true, async request() { return [{ id: 'e1', organization_id: 't1' }, { id: 'e2', organization_id: 't1' }]; } } as any;
  const workflows = {
    recoverExpiredExecutions: async () => 0,
    runExecution: async (_tenant: string, id: string) => { if (id === 'e1') throw new Error('boom'); return { status: 'completed' }; },
  } as any;
  const worker = new ExecutionWorkerService(db, workflows);
  const result = await worker.tick();
  assert.equal(result.attempted, 2);
  assert.equal(worker.health().completed, 1);
  assert.equal(worker.health().lastError, 'boom');
});
