import crypto from 'node:crypto';
import { AuthorizedTarget, OffensiveSecurityJob, OffensiveScanType } from './offensive.types';

/**
 * Control-plane only. This service creates and approves bounded security jobs.
 * It deliberately does not execute scanners or exploits.
 * Execution belongs to isolated workers after policy authorization.
 */
export class OffensiveSecurityService {
  private readonly jobs = new Map<string, OffensiveSecurityJob>();

  createJob(input: {
    tenantId: string;
    requestedBy: string;
    name: string;
    scanType: OffensiveScanType;
    mode: OffensiveSecurityJob['mode'];
    targets: AuthorizedTarget[];
  }): OffensiveSecurityJob {
    if (!input.tenantId || !input.requestedBy) throw new Error('tenant and requester are required');
    if (!input.targets.length) throw new Error('at least one explicitly authorized target is required');
    if (input.targets.length > 100) throw new Error('target limit exceeded');

    for (const target of input.targets) {
      if (!target.target.trim()) throw new Error('target cannot be empty');
      if (/[\r\n]/.test(target.target)) throw new Error('invalid target');
    }

    const now = new Date().toISOString();
    const job: OffensiveSecurityJob = {
      id: crypto.randomUUID(),
      tenantId: input.tenantId,
      requestedBy: input.requestedBy,
      name: input.name.trim().slice(0, 200),
      scanType: input.scanType,
      mode: input.mode,
      targets: input.targets,
      status: 'requested',
      approvalRequired: true,
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.set(job.id, job);
    return job;
  }

  approveJob(jobId: string, tenantId: string, approverId: string): OffensiveSecurityJob {
    const job = this.jobs.get(jobId);
    if (!job || job.tenantId !== tenantId) throw new Error('job not found');
    if (job.requestedBy === approverId) throw new Error('requester cannot self-approve');
    if (job.status !== 'requested') throw new Error('job is not awaiting approval');

    job.status = 'approved';
    job.approvedBy = approverId;
    job.updatedAt = new Date().toISOString();
    return job;
  }

  getJob(jobId: string, tenantId: string): OffensiveSecurityJob | undefined {
    const job = this.jobs.get(jobId);
    return job?.tenantId === tenantId ? job : undefined;
  }

  listJobs(tenantId: string): OffensiveSecurityJob[] {
    return [...this.jobs.values()].filter((job) => job.tenantId === tenantId);
  }
}
