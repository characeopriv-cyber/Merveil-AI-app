import crypto from 'node:crypto';
import { RemediationAction, RemediationJob } from './remediation.types';

export class RemediationService {
  private readonly jobs = new Map<string, RemediationJob>();
  private readonly byIdempotency = new Map<string, string>();

  request(input: {
    tenantId: string;
    requestedBy: string;
    action: RemediationAction;
    targetId: string;
    reason: string;
    idempotencyKey: string;
    ttlMs?: number;
  }): RemediationJob {
    if (!input.tenantId || !input.requestedBy || !input.targetId || !input.reason.trim()) throw new Error('invalid remediation request');
    if (!input.idempotencyKey || input.idempotencyKey.length > 200) throw new Error('invalid idempotency key');
    const key = `${input.tenantId}:${input.idempotencyKey}`;
    const existingId = this.byIdempotency.get(key);
    if (existingId) return this.jobs.get(existingId)!;
    const now = Date.now();
    const job: RemediationJob = {
      id: crypto.randomUUID(), tenantId: input.tenantId, requestedBy: input.requestedBy,
      action: input.action, targetId: input.targetId, reason: input.reason.trim().slice(0, 1000),
      status: 'approval_required', approvalRequired: true, idempotencyKey: input.idempotencyKey,
      expiresAt: new Date(now + Math.min(Math.max(input.ttlMs ?? 15 * 60_000, 60_000), 24 * 60 * 60_000)).toISOString(),
      createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(),
    };
    this.jobs.set(job.id, job); this.byIdempotency.set(key, job.id); return job;
  }

  approve(id: string, tenantId: string, approverId: string): RemediationJob {
    const job = this.require(id, tenantId); this.expire(job);
    if (job.requestedBy === approverId) throw new Error('requester cannot self-approve');
    if (job.status !== 'approval_required') throw new Error('remediation is not awaiting approval');
    job.status = 'approved'; job.approvedBy = approverId; job.updatedAt = new Date().toISOString(); return job;
  }

  reject(id: string, tenantId: string): RemediationJob { const job = this.require(id, tenantId); this.expire(job); if (job.status !== 'approval_required') throw new Error('remediation is not awaiting approval'); job.status = 'rejected'; job.updatedAt = new Date().toISOString(); return job; }

  markResult(id: string, tenantId: string, result: Record<string, unknown>, success: boolean): RemediationJob {
    const job = this.require(id, tenantId); this.expire(job);
    if (job.status !== 'approved' && job.status !== 'running') throw new Error('remediation is not executable');
    job.status = success ? 'succeeded' : 'failed'; job.result = { ...result }; job.updatedAt = new Date().toISOString(); return job;
  }

  get(id: string, tenantId: string) { const job = this.jobs.get(id); if (!job || job.tenantId !== tenantId) return undefined; this.expire(job); return job; }
  list(tenantId: string) { return [...this.jobs.values()].filter(j => j.tenantId === tenantId).map(j => { this.expire(j); return j; }); }

  private require(id: string, tenantId: string) { const job = this.jobs.get(id); if (!job || job.tenantId !== tenantId) throw new Error('remediation not found'); return job; }
  private expire(job: RemediationJob) { if (Date.parse(job.expiresAt) <= Date.now() && !['succeeded','failed','rejected','expired'].includes(job.status)) { job.status = 'expired'; job.updatedAt = new Date().toISOString(); } }
}
