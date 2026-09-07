import { BadRequestException, Injectable, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { WorkflowDefinition, WorkflowInstance, WorkflowTask, WorkflowTaskStatus } from './workflow.types';

const TASK_TRANSITIONS: Record<WorkflowTaskStatus, readonly WorkflowTaskStatus[]> = {
  pending: ['in_progress', 'rejected', 'cancelled'],
  in_progress: ['completed', 'rejected', 'cancelled'],
  completed: [],
  rejected: [],
  cancelled: [],
};

@Injectable()
export class WorkflowService {
  private readonly definitions = new Map<string, WorkflowDefinition>();
  private readonly instances = new Map<string, WorkflowInstance>();
  private readonly tasks = new Map<string, WorkflowTask>();

  createDefinition(input: { tenantId: string; name: string; steps: WorkflowDefinition['steps']; createdBy: string }): WorkflowDefinition {
    const name = input.name.trim();
    if (!input.tenantId || !input.createdBy || !name || !input.steps.length || input.steps.length > 50) throw new BadRequestException('invalid workflow definition');
    const steps = input.steps.map((step) => ({ name: step.name.trim(), requiresApproval: Boolean(step.requiresApproval) }));
    if (steps.some((step) => !step.name || step.name.length > 120)) throw new BadRequestException('invalid workflow step');
    const definition: WorkflowDefinition = { id: randomUUID(), tenantId: input.tenantId, name: name.slice(0, 160), steps, createdBy: input.createdBy, createdAt: new Date().toISOString() };
    this.definitions.set(definition.id, definition);
    return definition;
  }

  start(tenantId: string, workflowId: string, requestedBy: string): WorkflowInstance {
    const definition = this.definitions.get(workflowId);
    if (!definition || definition.tenantId !== tenantId) throw new BadRequestException('workflow not found');
    if (!requestedBy) throw new BadRequestException('requester required');
    const now = new Date().toISOString();
    const instance: WorkflowInstance = { id: randomUUID(), workflowId, tenantId, requestedBy, status: 'running', currentStep: 0, createdAt: now, updatedAt: now };
    this.instances.set(instance.id, instance);
    this.createTask(instance, definition.steps[0], now);
    return instance;
  }

  transitionTask(tenantId: string, taskId: string, actorId: string, to: WorkflowTaskStatus): WorkflowTask {
    const task = this.tasks.get(taskId);
    if (!task || task.tenantId !== tenantId) throw new BadRequestException('task not found');
    const instance = this.instances.get(task.instanceId);
    if (!instance || instance.tenantId !== tenantId) throw new BadRequestException('workflow instance not found');
    if (!actorId) throw new BadRequestException('actor required');
    if (task.status === 'pending' && to === 'completed' && instance.requestedBy === actorId) {
      throw new ForbiddenException('requester cannot self-approve workflow task');
    }
    if (!TASK_TRANSITIONS[task.status].includes(to)) {
      throw new BadRequestException(`Invalid task transition: ${task.status} -> ${to}`);
    }

    const now = new Date().toISOString();
    task.status = to;
    task.updatedAt = now;

    if (to === 'rejected' || to === 'cancelled') {
      instance.status = to;
      instance.updatedAt = now;
      return task;
    }

    if (to === 'completed') {
      const definition = this.definitions.get(instance.workflowId)!;
      const nextStep = instance.currentStep + 1;
      if (nextStep >= definition.steps.length) {
        instance.status = 'completed';
      } else {
        instance.currentStep = nextStep;
        this.createTask(instance, definition.steps[nextStep], now);
      }
      instance.updatedAt = now;
    }
    return task;
  }

  listDefinitions(tenantId: string) { return [...this.definitions.values()].filter((x) => x.tenantId === tenantId); }
  listInstances(tenantId: string) { return [...this.instances.values()].filter((x) => x.tenantId === tenantId); }
  listTasks(tenantId: string, instanceId?: string) { return [...this.tasks.values()].filter((x) => x.tenantId === tenantId && (!instanceId || x.instanceId === instanceId)); }

  private createTask(instance: WorkflowInstance, step: WorkflowDefinition['steps'][number], now: string) {
    const taskId = randomUUID();
    this.tasks.set(taskId, { id: taskId, instanceId: instance.id, tenantId: instance.tenantId, name: step.name, status: step.requiresApproval ? 'pending' : 'in_progress', createdAt: now, updatedAt: now });
  }
}
