import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkflowService } from './workflow.service';

const db = { enabled: false } as any;
const closedLoop = { executeRuleAction: async () => ({ actionId: 'test-action', status: 'completed' }) } as any;

function createService() {
  return new WorkflowService(db, closedLoop);
}

test('workflow definitions and instances are tenant isolated', () => {
  const service = createService();
  const definition = service.createDefinition({ tenantId: 'org-a', createdBy: 'user-a', name: 'Permit approval', steps: [{ name: 'Review', requiresApproval: true }, { name: 'Issue' }] });
  assert.equal(service.listDefinitions('org-a').length, 1);
  assert.equal(service.listDefinitions('org-b').length, 0);
  const instance = service.start('org-a', definition.id, 'user-a');
  assert.equal(instance.tenantId, 'org-a');
  assert.equal(service.listInstances('org-b').length, 0);
  assert.equal(service.listTasks('org-a', instance.id).length, 1);
  assert.equal(service.listTasks('org-b', instance.id).length, 0);
});

test('workflow starts the first approval task in pending state', () => {
  const service = createService();
  const definition = service.createDefinition({ tenantId: 'org-a', createdBy: 'user-a', name: 'Procurement', steps: [{ name: 'Manager approval', requiresApproval: true }] });
  const instance = service.start('org-a', definition.id, 'user-a');
  const [task] = service.listTasks('org-a', instance.id);
  assert.equal(task.status, 'pending');
  assert.ok(task.id);
});
