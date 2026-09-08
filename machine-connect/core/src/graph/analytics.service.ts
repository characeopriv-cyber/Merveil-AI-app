import { Injectable } from '@nestjs/common';
import { SupabaseRest } from '../persistence/supabase-rest';

@Injectable()
export class AnalyticsService {
  constructor(private readonly db: SupabaseRest) {}

  async degreeCentrality(organizationId: string) {
    const rows = await this.db.request<Array<{ source_entity_id: string; target_entity_id: string }>>(
      `relationships?organization_id=eq.${encodeURIComponent(organizationId)}&select=source_entity_id,target_entity_id&limit=10000`,
    );
    const degree = new Map<string, number>();
    for (const rel of rows) {
      degree.set(rel.source_entity_id, (degree.get(rel.source_entity_id) ?? 0) + 1);
      degree.set(rel.target_entity_id, (degree.get(rel.target_entity_id) ?? 0) + 1);
    }
    return [...degree.entries()].map(([entityId, value]) => ({ entityId, degree: value })).sort((a, b) => b.degree - a.degree);
  }

  async shortestPath(organizationId: string, sourceEntityId: string, targetEntityId: string, maxDepth = 6) {
    const rows = await this.db.request<any[]>('rpc/find_entity_shortest_path', {
      method: 'POST',
      body: JSON.stringify({
        p_source_entity_id: sourceEntityId, p_target_entity_id: targetEntityId,
        p_org_id: organizationId, p_max_depth: Math.min(Math.max(Math.trunc(maxDepth), 1), 10),
      }),
    });
    return rows;
  }
}
