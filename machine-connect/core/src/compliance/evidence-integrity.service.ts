import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { SupabaseRest } from '../persistence/supabase-rest';

function canonical(value: any): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
}

@Injectable()
export class EvidenceIntegrityService {
  constructor(private readonly db: SupabaseRest) {}

  async record(organizationId: string, evidenceId: string) {
    this.assertUuid(organizationId); this.assertUuid(evidenceId);
    const rows = await this.db.request<any[]>(`compliance_evidence?select=*&id=eq.${encodeURIComponent(evidenceId)}&organization_id=eq.${encodeURIComponent(organizationId)}&limit=1`);
    const evidence = rows[0];
    if (!evidence) throw new NotFoundException('Evidence not found');
    const contentHash = createHash('sha256').update(canonical(evidence)).digest('hex');
    const previous = await this.db.request<any[]>(`compliance_evidence_integrity?select=chain_hash&organization_id=eq.${encodeURIComponent(organizationId)}&order=recorded_at.desc&limit=1`);
    const previousHash = previous[0]?.chain_hash ?? null;
    const chainHash = createHash('sha256').update(`${evidenceId}:${contentHash}:${previousHash ?? ''}`).digest('hex');
    return this.db.request<any[]>('compliance_evidence_integrity', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify({ evidence_id: evidenceId, organization_id: organizationId, content_sha256: contentHash, previous_hash: previousHash, chain_hash: chainHash }) });
  }

  async verify(organizationId: string, evidenceId: string) {
    this.assertUuid(organizationId); this.assertUuid(evidenceId);
    const evidenceRows = await this.db.request<any[]>(`compliance_evidence?select=*&id=eq.${encodeURIComponent(evidenceId)}&organization_id=eq.${encodeURIComponent(organizationId)}&limit=1`);
    const integrityRows = await this.db.request<any[]>(`compliance_evidence_integrity?select=*&evidence_id=eq.${encodeURIComponent(evidenceId)}&organization_id=eq.${encodeURIComponent(organizationId)}&limit=1`);
    if (!evidenceRows[0] || !integrityRows[0]) throw new NotFoundException('Evidence integrity record not found');
    const record = integrityRows[0];
    const contentHash = createHash('sha256').update(canonical(evidenceRows[0])).digest('hex');
    const chainHash = createHash('sha256').update(`${evidenceId}:${contentHash}:${record.previous_hash ?? ''}`).digest('hex');
    return { evidenceId, valid: contentHash === record.content_sha256 && chainHash === record.chain_hash, contentHash, recordedHash: record.content_sha256, chainHash, recordedChainHash: record.chain_hash };
  }

  private assertUuid(value: string) { if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new BadRequestException('Invalid UUID'); }
}
