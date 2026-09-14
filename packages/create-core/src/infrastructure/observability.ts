export type CreationMetric = {
  name: string;
  value: number;
  projectId?: string;
  jobId?: string;
  providerId?: string;
  modelId?: string;
  modality?: string;
  at: string;
};

export type CreationTrace = {
  traceId: string;
  projectId: string;
  jobId?: string;
  startedAt: string;
  endedAt?: string;
  status: 'running' | 'succeeded' | 'failed';
  events: Array<{ name: string; at: string; data?: Record<string, unknown> }>;
};

export function metric(name: string, value: number, tags: Omit<CreationMetric, 'name' | 'value' | 'at'> = {}): CreationMetric {
  return { name, value, ...tags, at: new Date().toISOString() };
}

export function startTrace(traceId: string, projectId: string, jobId?: string): CreationTrace {
  return { traceId, projectId, jobId, startedAt: new Date().toISOString(), status: 'running', events: [] };
}
