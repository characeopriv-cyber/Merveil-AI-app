import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { WorkflowDefinition, WorkflowInstance, WorkflowTask } from './workflow.types';

@Injectable()
export class WorkflowService {
  private readonly definitions = new Map<string, WorkflowDefinition>();
  private readonly instances = new Map<string, WorkflowInstance>();
  private readonly tasks = new Map<string, WorkflowTask>();

  createDefinition(input: { tenantId: string; name: string; steps: WorkflowDefinition['steps']; createdBy: string }): WorkflowDefinition {
    const name = input.name.trim();
    if (!input.tenantId || !input.createdBy || !name || !input.steps.length || input.steps.length > 50) throw new Error('invalid workflow definition');
    const steps = input.steps.map((step) => ({ name: step.name.trim(), requiresApproval: Boolean(step.requiresApproval) }));
    if (steps.some((step) => !step.name || step.name.length > 120)) throw new Error('invalid workflow step');
    const definition: WorkflowDefinition = { id: randomUUID(), tenantId: input.tenantId, name: name.slice(0, 160), steps, createdBy: input.createdBy, createdAt: new Date().toISOString() };
    this.definitions.set(definition.id, definition);
    return definition;
  }

  start(tenantId: string, workflowId: string, requestedBy: string): WorkflowInstance {
    const definition = this.definitions.get(workflowId);
    if (!definition || definition.tenantId !== tenantId) throw new Error('workflow not found');
    if (!requestedBy) throw new Error('requester required');
    const now = new Date().toISOString();
    const instance: WorkflowInstance = { id: randomUUID(), workflowId, tenantId, requestedBy, status: 'running', currentStep: 0, createdAt: now, updatedAt: now };
    this.instances.set(instance.id, instance);
    const taskId = randomUUID();
    const step = definition.steps[0];
    this.tasks.set(taskId, { id: taskId, instanceId: instance.id, tenantId, name: step.name, status: step.requiresApproval ? 'pending' : 'in_progress', createdAt: now, updatedAt: now });
    return instance;
  }

  listDefinitions(tenantId: string) { return [...this.definitions.values()].filter((x) => x.tenantId === tenantId); }
  listInstances(tenantId: string) { return [...this.instances.values()].filter((x) => x.tenantId === tenantId); }
  listTasks(tenantId: string, instanceId?: string) { return [...this.tasks.values()].filter((x) => x.tenantId === tenantId && (!instanceId || x.instanceId === instanceId)); }
}
