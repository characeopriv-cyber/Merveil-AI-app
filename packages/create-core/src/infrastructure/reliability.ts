/**
 * Merveil Create Core — Reliability Foundation
 *
 * Provider calls are treated as distributed work. Every execution has a
 * stable idempotency key, bounded retries, timeout metadata and a durable
 * recovery state. This module contains policy only; persistence is supplied
 * by the host runtime.
 */

export type RecoveryState = 'ready' | 'running' | 'deferred' | 'retrying' | 'failed' | 'succeeded';

export type RetryPolicy = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitter: number;
};

export type ExecutionReceipt = {
  idempotencyKey: string;
  attempt: number;
  state: RecoveryState;
  startedAt: string;
  completedAt?: string;
  providerId?: string;
  externalJobId?: string;
  errorCode?: string;
};

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 1500,
  maxDelayMs: 30_000,
  jitter: 0.2,
};

export function executionKey(projectId: string, jobId: string, capability: string, version = 1): string {
  return `${projectId}:${jobId}:${capability}:v${version}`;
}

export function retryDelay(attempt: number, policy = DEFAULT_RETRY_POLICY, random = Math.random): number {
  const raw = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** Math.max(0, attempt - 1));
  const spread = raw * policy.jitter;
  return Math.max(0, Math.round(raw - spread + random() * spread * 2));
}

export function canRetry(attempt: number, policy = DEFAULT_RETRY_POLICY): boolean {
  return attempt < policy.maxAttempts;
}
