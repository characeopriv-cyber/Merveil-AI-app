export type SafetyDecision = 'allow' | 'approval_required' | 'deny';

export interface SafetyContext {
  authenticated: boolean;
  authorized: boolean;
  machineActive: boolean;
  capabilityKnown: boolean;
  emergencyStopped: boolean;
  critical: boolean;
}

export function decideSafety(context: SafetyContext): SafetyDecision {
  if (!context.authenticated || !context.authorized || !context.machineActive || !context.capabilityKnown) return 'deny';
  if (context.emergencyStopped) return 'deny';
  if (context.critical) return 'approval_required';
  return 'allow';
}
