import { CheckTargetKind, VerificationCheck, VerificationFinding } from '../contracts/check';

const HOST = /^(?=.{1,253}$)[a-zA-Z0-9.-]+$/;
const IP = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const URL = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

/** Runs only pre-installed, explicitly registered verification checks. */
export class VerificationCheckRunner {
  private readonly checks = new Map<string, VerificationCheck>();

  register(check: VerificationCheck): void {
    if (!check.id || this.checks.has(check.id)) throw new Error('invalid or duplicate check');
    this.checks.set(check.id, check);
  }

  async run(checkId: string, context: { tenantId: string; target: string; targetKind: CheckTargetKind; timeoutMs?: number }): Promise<VerificationFinding[]> {
    const check = this.checks.get(checkId);
    if (!check) throw new Error('unknown verification check');
    this.validateTarget(context.target, context.targetKind);
    const timeoutMs = Math.min(Math.max(context.timeoutMs ?? 5000, 250), 30000);
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error('check timeout')), timeoutMs));
    return Promise.race([check.run({ ...context, timeoutMs }), timeout]);
  }

  private validateTarget(target: string, kind: CheckTargetKind): void {
    if (!target || /[\r\n]/.test(target) || target.length > 253) throw new Error('invalid target');
    if (kind === 'ip' && !IP.test(target)) throw new Error('invalid IP target');
    if (kind === 'hostname' && !HOST.test(target)) throw new Error('invalid hostname target');
    if (kind === 'url' && !URL.test(target)) throw new Error('invalid URL target');
  }
}
