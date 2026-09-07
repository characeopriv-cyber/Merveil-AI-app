import { OffensiveJob } from '../contracts/job';
import { OffensiveJobResult, OffensiveFinding } from '../contracts/result';

export interface NmapExecutor {
  execute(target: string): Promise<string>;
}

const allowedTarget = /^(?:[A-Za-z0-9.-]+|\d{1,3}(?:\.\d{1,3}){3})(?:\/\d{1,2})?$/;

/**
 * Adapter boundary for Nmap. The actual process/container runner is injected.
 * No shell command is assembled from user input here.
 */
export async function runNmapDiscovery(job: OffensiveJob, executor: NmapExecutor): Promise<OffensiveJobResult> {
  if (job.mode !== 'discovery') throw new Error('Nmap worker only supports discovery mode');
  if (job.targets.length === 0 || job.targets.length > 32) throw new Error('Invalid target count');
  if (job.targets.some((target) => !allowedTarget.test(target.value) || target.kind === 'url')) {
    throw new Error('Nmap target is not an approved network target');
  }

  const findings: OffensiveFinding[] = [];
  for (const target of job.targets) {
    const output = await executor.execute(target.value);
    findings.push({
      id: crypto.randomUUID(),
      jobId: job.id,
      tenantId: job.tenantId,
      target: target.value,
      scanner: 'nmap',
      title: 'Network discovery completed',
      severity: 'info',
      evidence: { output: output.slice(0, 100_000) },
      observedAt: new Date().toISOString(),
    });
  }

  return {
    jobId: job.id,
    tenantId: job.tenantId,
    status: 'completed',
    findings,
    completedAt: new Date().toISOString(),
    summary: { info: findings.length },
  };
}
