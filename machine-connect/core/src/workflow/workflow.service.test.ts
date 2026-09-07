import { WorkflowService } from './workflow.service';

describe('WorkflowService', () => {
  it('keeps definitions and instances tenant isolated', () => {
    const service = new WorkflowService();
    const definition = service.createDefinition({
      tenantId: 'org-a',
      createdBy: 'user-a',
      name: 'Permit approval',
      steps: [{ name: 'Review', requiresApproval: true }, { name: 'Issue' }],
    });

    expect(service.listDefinitions('org-a')).toHaveLength(1);
    expect(service.listDefinitions('org-b')).toHaveLength(0);

    const instance = service.start('org-a', definition.id, 'user-a');
    expect(instance.tenantId).toBe('org-a');
    expect(service.listInstances('org-b')).toHaveLength(0);
    expect(service.listTasks('org-a', instance.id)).toHaveLength(1);
    expect(service.listTasks('org-b', instance.id)).toHaveLength(0);
  });

  it('starts the first approval task in pending state', () => {
    const service = new WorkflowService();
    const definition = service.createDefinition({
      tenantId: 'org-a',
      createdBy: 'user-a',
      name: 'Procurement',
      steps: [{ name: 'Manager approval', requiresApproval: true }],
    });
    const instance = service.start('org-a', definition.id, 'user-a');
    const [task] = service.listTasks('org-a', instance.id);
    expect(task.status).toBe('pending');
    expect(task.id).toBeTruthy();
  });
});
