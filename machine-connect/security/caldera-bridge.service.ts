import crypto from 'node:crypto';
import { CalderaCampaignRequest, CalderaResult } from './caldera.types';

/** Control-plane bridge only. CALDERA execution must happen in an isolated worker. */
export class CalderaBridgeService {
  private readonly campaigns = new Map<string, CalderaCampaignRequest>();

  request(input: { tenantId: string; name: string; targetRefs: string[]; ttlMs?: number }): CalderaCampaignRequest {
    if (!input.tenantId || !input.name.trim() || !input.targetRefs.length || input.targetRefs.length > 20) throw new Error('invalid campaign request');
    const now = Date.now();
    const campaign: CalderaCampaignRequest = {
      id: crypto.randomUUID(), tenantId: input.tenantId, name: input.name.trim().slice(0, 200),
      targetRefs: [...input.targetRefs], status: 'requested',
      expiresAt: new Date(now + Math.min(Math.max(input.ttlMs ?? 15 * 60_000, 60_000), 4 * 60 * 60_000)).toISOString(),
    };
    this.campaigns.set(campaign.id, campaign); return campaign;
  }

  approve(id: string, tenantId: string, approverId: string): CalderaCampaignRequest {
    const c = this.require(id, tenantId); this.expire(c);
    if (!approverId) throw new Error('approver required');
    if (c.status !== 'requested') throw new Error('campaign is not awaiting approval');
    c.status = 'approved'; c.approvedBy = approverId; return c;
  }

  normalize(result: CalderaResult): CalderaResult {
    if (!result.campaignId || !result.tenantId) throw new Error('invalid campaign result');
    return { ...result, findings: result.findings.slice(0, 1000) };
  }

  get(id: string, tenantId: string) { const c = this.campaigns.get(id); if (!c || c.tenantId !== tenantId) return undefined; this.expire(c); return c; }
  list(tenantId: string) { return [...this.campaigns.values()].filter(c => c.tenantId === tenantId).map(c => { this.expire(c); return c; }); }

  private require(id: string, tenantId: string) { const c = this.campaigns.get(id); if (!c || c.tenantId !== tenantId) throw new Error('campaign not found'); return c; }
  private expire(c: CalderaCampaignRequest) { if (Date.parse(c.expiresAt) <= Date.now() && !['completed','failed','expired'].includes(c.status)) c.status = 'expired'; }
}
