import { Injectable } from '@nestjs/common';
import { SupabaseRest } from '../persistence/supabase-rest';

@Injectable()
export class RateLimitService {
  constructor(private readonly db: SupabaseRest) {}

  async allow(organizationId: string, bucketKey: string, limit: number, windowSeconds = 60): Promise<boolean> {
    const params = new URLSearchParams();
    params.set('p_org_id', organizationId);
    params.set('p_bucket_key', bucketKey);
    params.set('p_limit', String(Math.max(1, Math.min(limit, 100000))));
    params.set('p_window_seconds', String(Math.max(1, Math.min(windowSeconds, 3600))));
    const rows = await this.db.request<Array<{ machine_connect_rate_limit_allow?: boolean }>>('rpc/machine_connect_rate_limit_allow', {
      method: 'POST',
      body: JSON.stringify({
        p_org_id: organizationId,
        p_bucket_key: bucketKey,
        p_limit: Math.max(1, Math.min(limit, 100000)),
        p_window_seconds: Math.max(1, Math.min(windowSeconds, 3600)),
      }),
    });
    return Boolean(rows?.[0]?.machine_connect_rate_limit_allow);
  }
}
