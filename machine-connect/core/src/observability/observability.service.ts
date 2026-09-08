import { Injectable } from '@nestjs/common';
import { SupabaseRest } from '../persistence/supabase-rest';

export type ObservabilityLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

@Injectable()
export class ObservabilityService {
  constructor(private readonly db: SupabaseRest) {}

  async record(input: {
    organizationId?: string;
    traceId?: string;
    requestId?: string;
    service: string;
    eventName: string;
    level?: ObservabilityLevel;
    durationMs?: number;
    statusCode?: number;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    if (!input.service || !input.eventName) throw new Error('Observability service and event are required');
    await this.db.request('machine_connect_observability_events', {
      method: 'POST',
      body: JSON.stringify({
        organization_id: input.organizationId ?? null,
        trace_id: input.traceId ?? null,
        request_id: input.requestId ?? null,
        service: input.service,
        event_name: input.eventName,
        level: input.level ?? 'info',
        duration_ms: input.durationMs == null ? null : Math.max(0, Math.round(input.durationMs)),
        status_code: input.statusCode == null ? null : input.statusCode,
        metadata: input.metadata ?? {},
      }),
    });
  }
}
