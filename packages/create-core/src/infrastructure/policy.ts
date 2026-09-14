/**
 * Policy gate before provider execution. Hosts can extend this with KYC,
 * age, rights, consent and regional policy checks without coupling them to
 * provider adapters.
 */
export type PolicyDecision = {
  allowed: boolean;
  reasons: string[];
  requiredActions: string[];
};

export type PolicyInput = {
  ownerId: string;
  projectId: string;
  capability: string;
  publicPublish?: boolean;
  usesLikeness?: boolean;
  hasLikenessConsent?: boolean;
  containsThirdPartyAsset?: boolean;
  hasRights?: boolean;
};

export function evaluatePolicy(input: PolicyInput): PolicyDecision {
  const reasons: string[] = [];
  const requiredActions: string[] = [];

  if (input.usesLikeness && !input.hasLikenessConsent) {
    reasons.push('likeness_consent_required');
  }
  if (input.containsThirdPartyAsset && !input.hasRights) {
    reasons.push('third_party_rights_required');
  }
  if (input.publicPublish && !input.ownerId) {
    reasons.push('authenticated_owner_required');
  }
  if (input.publicPublish) requiredActions.push('publish_review');

  return { allowed: reasons.length === 0, reasons, requiredActions };
}
