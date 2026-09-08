import { Injectable } from '@nestjs/common';
import { SupabaseRest } from '../persistence/supabase-rest';

export interface SyncLedgerClaim {
  id: string;
  duplicate: boolean;
  telemetryId?: string | null;
  jobId?: string | null;
  status: string;
}

@Injectable()
export class ConnectorSyncLedgerService {
  constructor(private readonly db: SupabaseRest) {}

  async claim(input: { organizationId: string; connectorId: string; machineId: string; actorId: string; idempotencyKey: string }): Promise<SyncLedgerClaim> {
    if (!this.db.enabled) return { id: `local:${input.idempotencyKey}`, duplicate: false, status: 'accepted' };
    const existing = await this.db.request<any[]>(`machine_connect_connector_syncs?organization_id=eq.${encodeURIComponent(input.organizationId)}&idempotency_key=eq.${encodeURIComponent(input.idempotencyKey)}&select=id,status,telemetry_id,job_id&limit=1`);
    if (existing[0]) return { id: existing[0].id, duplicate: true, status: existing[0].status, telemetryId: existing[0].telemetry_id, jobId: existing[0].job_id };
    const rows = await this.db.request<any[]>('machine_connect_connector_syncs', {
      method: 'POST',
      headers: { Prefer: 'return=representation,resolution=ignore-duplicates' },
      body: JSON.stringify({ organization_id: input.organizationId, connector_id: input.connectorId, machine_id: input.machineId, actor_id: input.actorId, idempotency_key: input.idempotencyKey, status: 'accepted' }),
    });
    if (rows?.[0]) return { id: rows[0].id, duplicate: false, status: rows[0].status };
    const raced = await this.db.request<any[]>(`machine_connect_connector_syncs?organization_id=eq.${encodeURIComponent(input.organizationId)}&idempotency_key=eq.${encodeURIComponent(input.idempotencyKey)}&select=id,status,telemetry_id,job_id&limit=1`);
    if (!raced[0]) throw new Error('Unable to claim connector synchronization');
    return { id: raced[0].id, duplicate: true, status: raced[0].status, telemetryId: raced[0].telemetry_id, jobId: raced[0].job_id };
  }

  async complete(organizationId: string, id: string, result: { telemetryId: string; jobId: string; digest: string; bytes: number; latencyMs: number }): Promise<void> {
    if (!this.db.enabled || id.startsWith('local:')) return;
    await this.db.request(`machine_connect_connector_syncs?id=eq.${encodeURIComponent(id)}&organization_id=eq.${encodeURIComponent(organizationId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'accepted', telemetry_id: result.telemetryId, job_id: result.jobId, payload_digest: result.digest, bytes: result.bytes, latency_ms: result.latencyMs, completed_at: new Date().toISOString() }),
    });
  }

  async fail(organizationId: string, id: string, errorCode: string): Promise<void> {
    if (!this.db.enabled || id.startsWith('local:')) return;
    await this.db.request(`machine_connect_connector_syncs?id=eq.${encodeURIComponent(id)}&organization_id=eq.${encodeURIComponent(organizationId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'failed', error_code: errorCode.slice(0, 120), completed_at: new Date().toISOString() }),
    });
  }
}
