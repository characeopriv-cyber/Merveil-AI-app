import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { WorkflowService } from '../workflow/workflow.service';
import { ServiceRequest } from './service-request.types';

@Injectable()
export class ServiceRequestService {
  private readonly requests = new Map<string, ServiceRequest>();
  private readonly byIdempotency = new Map<string, string>();

  constructor(private readonly workflows: WorkflowService) {}

  create(input: { tenantId: string; requesterId: string; title: string; category: string; payload?: Record<string, unknown>; idempotencyKey: string; workflowId?: string }): ServiceRequest {
    const title = input.title?.trim();
    const category = input.category?.trim();
    if (!input.tenantId || !input.requesterId || !title || !category || !input.idempotencyKey) throw new Error('invalid service request');
    if (title.length > 200 || category.length > 100 || input.idempotencyKey.length > 200) throw new Error('service request field limit exceeded');

    const key = `${input.tenantId}:${input.idempotencyKey}`;
    const existingId = this.byIdempotency.get(key);
    if (existingId) return this.requests.get(existingId)!;

    let workflowInstanceId: string | undefined;
    if (input.workflowId) {
      workflowInstanceId = this.workflows.start(input.tenantId, input.workflowId, input.requesterId).id;
    }

    const now = new Date().toISOString();
    const request: ServiceRequest = {
      id: randomUUID(), tenantId: input.tenantId, requesterId: input.requesterId,
      title: title.slice(0, 200), category: category.slice(0, 100), payload: input.payload ?? {},
      status: workflowInstanceId ? 'in_review' : 'submitted', workflowInstanceId,
      idempotencyKey: input.idempotencyKey, createdAt: now, updatedAt: now,
    };
    this.requests.set(request.id, request);
    this.byIdempotency.set(key, request.id);
    return request;
  }

  get(tenantId: string, id: string): ServiceRequest | undefined {
    const request = this.requests.get(id);
    return request?.tenantId === tenantId ? request : undefined;
  }

  list(tenantId: string): ServiceRequest[] {
    return [...this.requests.values()].filter((request) => request.tenantId === tenantId);
  }
}
