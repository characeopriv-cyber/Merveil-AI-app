export type CheckTargetKind = 'ip' | 'hostname' | 'url';

export interface VerificationCheckContext {
  tenantId: string;
  target: string;
  targetKind: CheckTargetKind;
  timeoutMs: number;
}

export interface VerificationFinding {
  checkId: string;
  target: string;
  severity: 'info' | 'low' | 'medium' | 'high';
  title: string;
  evidence: Record<string, unknown>;
}

export interface VerificationCheck {
  readonly id: string;
  readonly description: string;
  run(context: VerificationCheckContext): Promise<VerificationFinding[]>;
}
