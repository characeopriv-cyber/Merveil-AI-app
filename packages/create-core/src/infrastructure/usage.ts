/** Cost/usage accounting contract. Never report provider usage unless returned by the provider. */
export type UsageRecord = {
  projectId: string;
  jobId: string;
  ownerId: string;
  providerId?: string;
  modelId?: string;
  modality: string;
  inputUnits?: number;
  outputUnits?: number;
  durationSeconds?: number;
  providerCostUsd?: number;
  recordedAt: string;
};

export type Budget = {
  maxUsd?: number;
  maxInputUnits?: number;
  maxOutputUnits?: number;
  maxDurationSeconds?: number;
};

export function exceedsBudget(usage: UsageRecord[], budget: Budget): boolean {
  const cost = usage.reduce((n, u) => n + (u.providerCostUsd ?? 0), 0);
  const input = usage.reduce((n, u) => n + (u.inputUnits ?? 0), 0);
  const output = usage.reduce((n, u) => n + (u.outputUnits ?? 0), 0);
  const duration = usage.reduce((n, u) => n + (u.durationSeconds ?? 0), 0);
  return (budget.maxUsd !== undefined && cost > budget.maxUsd)
    || (budget.maxInputUnits !== undefined && input > budget.maxInputUnits)
    || (budget.maxOutputUnits !== undefined && output > budget.maxOutputUnits)
    || (budget.maxDurationSeconds !== undefined && duration > budget.maxDurationSeconds);
}
