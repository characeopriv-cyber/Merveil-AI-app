import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseRest } from '../persistence/supabase-rest';

@Injectable()
export class ComplianceService {
  constructor(private readonly db: SupabaseRest) {}

  async frameworks() {
    return this.db.request<any[]>('compliance_frameworks?select=*&order=name.asc');
  }

  async controls(frameworkId?: string) {
    const path = frameworkId
      ? `compliance_controls?select=*&framework_id=eq.${encodeURIComponent(frameworkId)}&order=control_id.asc`
      : 'compliance_controls?select=*&order=control_id.asc';
    return this.db.request<any[]>(path);
  }

  async statuses(organizationId: string) {
    this.assertUuid(organizationId);
    return this.db.request<any[]>(`compliance_control_status?select=*&organization_id=eq.${encodeURIComponent(organizationId)}&order=updated_at.desc`);
  }

  async upsertStatus(organizationId: string, controlId: string, input: any, ownerId: string) {
    this.assertUuid(organizationId); this.assertUuid(controlId); this.assertUuid(ownerId);
    const status = String(input?.status ?? 'not_started');
    if (!['not_started','in_progress','implemented','verified','exception'].includes(status)) throw new BadRequestException('Invalid compliance status');
    return this.db.request<any[]>('compliance_control_status', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ organization_id: organizationId, control_id: controlId, status, owner_id: ownerId, notes: input?.notes ?? null, last_verified_at: status === 'verified' ? new Date().toISOString() : null })
    });
  }

  async evidence(organizationId: string) {
    this.assertUuid(organizationId);
    return this.db.request<any[]>(`compliance_evidence?select=*&organization_id=eq.${encodeURIComponent(organizationId)}&order=collected_at.desc`);
  }

  private assertUuid(value: string) { if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new BadRequestException('Invalid UUID'); }
}
