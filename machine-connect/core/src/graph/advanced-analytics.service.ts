import { Injectable } from '@nestjs/common';
import { SupabaseRest } from '../persistence/supabase-rest';

@Injectable()
export class AdvancedAnalyticsService {
  constructor(private readonly db: SupabaseRest) {}

  async pageRank(organizationId: string, iterations = 20, damping = 0.85) {
    const safeIterations = Math.min(Math.max(Math.trunc(iterations), 1), 100);
    const safeDamping = Math.min(Math.max(Number(damping), 0), 0.99);
    return this.db.request<Array<{ entity_id: string; rank: number }>>('rpc/pagerank', {
      method: 'POST',
      body: JSON.stringify({ p_org_id: organizationId, iterations: safeIterations, damping: safeDamping }),
    });
  }

  async communities(organizationId: string, limit = 10000) {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 10000);
    return this.db.request<Array<{ entity_id: string; community_id: number; updated_at: string }>>(
      `entity_communities?organization_id=eq.${encodeURIComponent(organizationId)}&select=entity_id,community_id,updated_at&order=community_id.asc&limit=${safeLimit}`,
    );
  }

  async shortestPath(organizationId: string, sourceEntityId: string, targetEntityId: string, maxDepth = 20) {
    const safeDepth = Math.min(Math.max(Math.trunc(maxDepth), 1), 100);
    return this.db.request<Array<{ path_entity: string; step: number }>>('rpc/shortest_path', {
      method: 'POST',
      body: JSON.stringify({
        p_start: sourceEntityId,
        p_end: targetEntityId,
        p_org_id: organizationId,
        p_max_depth: safeDepth,
      }),
    });
  }
}
