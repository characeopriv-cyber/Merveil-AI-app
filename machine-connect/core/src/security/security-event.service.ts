import { Injectable } from '@nestjs/common';
import { SupabaseRest } from '../persistence/supabase-rest';

@Injectable()
export class SecurityEventService {
  constructor(private readonly db: SupabaseRest) {}

  async record(input: { organizationId?: string; actorId?: string; eventType: string; severity?: 'debug'|'info'|'warn'|'error'|'critical'; requestId?: string; traceId?: string; resourceType?: string; resourceId?: string; metadata?: Record<string, unknown> }): Promise<void> {
    if (!input.eventType) throw new Error('Security event type is required');
    await this.db.request('machine_connect_security_events', {
      method: 'POST',
      body: JSON.stringify({
        organization_id: input.organizationId ?? null,
        actor_id: input.actorId ?? null,
        event_type: input.eventType,
        severity: input.severity ?? 'info',
        request_id: input.requestId ?? null,
        trace_id: input.traceId ?? null,
        resource_type: input.resourceType ?? null,
        resource_id: input.resourceId ?? null,
        metadata: input.metadata ?? {},
      }),
    });
  }
}
