import { Injectable } from '@nestjs/common';
import { CapabilitySafetyClass } from '../domain/capability';

export interface PolicyDecision {
  allowed: boolean;
  approvalRequired: boolean;
  reason: string;
}

@Injectable()
export class PolicyService {
  evaluate(input: {
    lifecycleState: string;
    capabilitySafetyClass: CapabilitySafetyClass;
    capabilityKnown: boolean;
    actorAuthorized: boolean;
  }): PolicyDecision {
    if (!input.capabilityKnown) return { allowed: false, approvalRequired: false, reason: 'UNKNOWN_CAPABILITY' };
    if (!input.actorAuthorized) return { allowed: false, approvalRequired: false, reason: 'UNAUTHORIZED_ACTOR' };
    if (input.lifecycleState !== 'active') return { allowed: false, approvalRequired: false, reason: 'MACHINE_NOT_ACTIVE' };
    if (input.capabilitySafetyClass === 'critical') {
      return { allowed: true, approvalRequired: true, reason: 'CRITICAL_ACTION_REQUIRES_APPROVAL' };
    }
    return { allowed: true, approvalRequired: false, reason: 'POLICY_ALLOWED' };
  }
}
