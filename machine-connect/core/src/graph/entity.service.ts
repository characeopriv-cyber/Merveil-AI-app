import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SupabaseRest } from '../persistence/supabase-rest';

export type EntityInput = {
  entityTypeId: string;
  displayName: string;
  properties?: Record<string, unknown>;
};

@Injectable()
export class EntityService {
  constructor(private readonly db: SupabaseRest) {}

  async create(organizationId: string, userId: string, input: EntityInput) {
    this.validateUuid(organizationId, 'organizationId');
    this.validateUuid(userId, 'userId');
    this.validateUuid(input.entityTypeId, 'entityTypeId');
    const displayName = String(input.displayName ?? '').trim();
    if (!displayName || displayName.length > 240) throw new BadRequestException('displayName must be 1-240 characters');
    const rows = await this.db.request<any[]>('entities', {
      method: 'POST',
      body: JSON.stringify({
        id: randomUUID(), entity_type_id: input.entityTypeId, organization_id: organizationId,
        display_name: displayName, properties: input.properties ?? {}, created_by: userId,
      }),
    });
    return rows[0];
  }

  async get(organizationId: string, entityId: string) {
    this.validateUuid(entityId, 'entityId');
    const rows = await this.db.request<any[]>(`entities?id=eq.${encodeURIComponent(entityId)}&organization_id=eq.${encodeURIComponent(organizationId)}&select=*,entity_types(name)`);
    if (!rows.length) throw new NotFoundException('Entity not found');
    return rows[0];
  }

  async search(organizationId: string, query = '', entityTypeId?: string, limit = 50) {
    const safeLimit = Math.min(Math.max(Number.isFinite(limit) ? limit : 50, 1), 200);
    const terms = String(query).trim();
    const params = new URLSearchParams({ organization_id: `eq.${organizationId}`, limit: String(safeLimit), order: 'updated_at.desc', select: '*,entity_types(name)' });
    if (entityTypeId) {
      this.validateUuid(entityTypeId, 'entityTypeId');
      params.set('entity_type_id', `eq.${entityTypeId}`);
    }
    if (terms) params.set('search_vector', `fts.${encodeURIComponent(terms)}`);
    return this.db.request<any[]>(`entities?${params.toString()}`);
  }

  async graph(organizationId: string, entityId: string, depth = 2) {
    this.validateUuid(entityId, 'entityId');
    const safeDepth = Math.min(Math.max(Number.isFinite(depth) ? Math.trunc(depth) : 2, 0), 6);
    return this.db.request<any[]>('rpc/get_entity_graph_workspace', {
      method: 'POST', body: JSON.stringify({ p_entity_id: entityId, p_depth: safeDepth, p_org_id: organizationId }),
    });
  }

  private validateUuid(value: string, field: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
      throw new BadRequestException(`${field} must be a UUID`);
    }
  }
}
