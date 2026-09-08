import { BadRequestException, Body, Controller, Param, Post, Req } from '@nestjs/common';
import { requirePrincipal } from '../auth/principal';
import { TelemetryService } from '../telemetry/telemetry.service';
import { SupabaseRest } from '../persistence/supabase-rest';

type RequestWithPrincipal = { user?: { actorId: string; tenantId: string; roles: any[]; authenticated: true } };
type SyncTelemetryItem = {
  queue_id: string;
  idempotency_key: string;
  operation: 'insert';
  table_name: 'telemetry';
  record_id?: string;
  data: Record<string, unknown>;
  observed_at: string;
  sequence_no?: number;
  source?: string;
  schema_version?: number;
};

type SyncTelemetryBody = { items: SyncTelemetryItem[] };

@Controller('api/machines/:machineId/sync')
export class OfflineSyncController {
  constructor(private readonly telemetry: TelemetryService, private readonly db: SupabaseRest) {}

  @Post('telemetry')
  async telemetryBatch(@Req() req: RequestWithPrincipal, @Param('machineId') machineId: string, @Body() body: SyncTelemetryBody) {
    const principal = requirePrincipal(req.user);
    if (principal.actorId !== `machine:${machineId}`) throw new BadRequestException('Sync principal does not match machine');
    if (!Array.isArray(body?.items) || body.items.length < 1 || body.items.length > 100) throw new BadRequestException('items must contain 1-100 telemetry records');

    const results: Array<{ queue_id: string; idempotency_key: string; confirmed: boolean; record_id: string }> = [];
    for (const item of body.items) {
      if (item.operation !== 'insert' || item.table_name !== 'telemetry' || !item.queue_id || !item.idempotency_key || !item.observed_at || !item.data || typeof item.data !== 'object') {
        throw new BadRequestException('Invalid telemetry sync envelope');
      }
      if (item.idempotency_key !== `offline-sync:${item.queue_id}`) throw new BadRequestException('Invalid telemetry idempotency key');
      const source = item.source ?? 'offline';
      const existing = this.db.enabled && item.sequence_no != null
        ? await this.db.request<any[]>(`machine_connect_telemetry?organization_id=eq.${encodeURIComponent(principal.tenantId)}&machine_id=eq.${encodeURIComponent(machineId)}&source=eq.${encodeURIComponent(source)}&sequence_no=eq.${encodeURIComponent(String(item.sequence_no))}&limit=1`)
        : [];
      if (existing.length) {
        results.push({ queue_id: item.queue_id, idempotency_key: item.idempotency_key, confirmed: true, record_id: String(existing[0].id) });
        continue;
      }
      const record = await this.telemetry.append({
        tenantId: principal.tenantId,
        machineId,
        source,
        schemaVersion: Number(item.schema_version ?? 1),
        sequence: item.sequence_no,
        observedAt: item.observed_at,
        quality: 'unknown',
        data: item.data,
      });
      results.push({ queue_id: item.queue_id, idempotency_key: item.idempotency_key, confirmed: true, record_id: record.id });
    }
    return { confirmed: true, machine_id: machineId, items: results };
  }
}
