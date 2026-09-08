import assert from 'node:assert/strict';
import test from 'node:test';
import { ExecutionWorkerService } from './execution-worker.service';

test('worker processes only bounded queued executions', async () => {
  const calls: string[] = [];
  const db = {
    enabled: true,
    async request() {
      return [
        { id: 'e1', organization_id: 't1' },
        { id: 'e2', organization_id: 't2' },
        { id: 'e3', organization_id: 't3' },
      ];
    },
  } as any;
  const workflows = {
    async runExecution(tenantId: string, executionId: string) {
      calls.push(`${tenantId}:${executionId}`);
    },
  } as any;
  const worker = new ExecutionWorkerService(db, workflows);
  const result = await worker.tick();
  assert.deepEqual(result, { claimed: 3, attempted: 3 });
  assert.deepEqual(calls, ['t1:e1', 't2:e2', 't3:e3']);
});

test('worker prevents overlapping ticks', async () => {
  let resolve: (() => void) | undefined;
  const db = {
    enabled: true,
    async request() {
      await new Promise<void>((r) => { resolve = r; });
      return [];
    },
  } as any;
  const workflows = {} as any;
  const worker = new ExecutionWorkerService(db, workflows);
  const first = worker.tick();
  const second = await worker.tick();
  assert.deepEqual(second, { claimed: 0, attempted: 0 });
  resolve?.();
  assert.deepEqual(await first, { claimed: 0, attempted: 0 });
});
