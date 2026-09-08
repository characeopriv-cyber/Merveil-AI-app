import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SupabaseRest } from '../persistence/supabase-rest';

@Injectable()
export class RelationshipService {
  constructor(private readonly db: SupabaseRest) {}

  async create(organizationId: string, userId: string, input: { sourceEntityId: string; targetEntityId: string; relationshipType: string; properties?: Record<string, unknown> }) {
    for (const [name, value] of Object.entries({ organizationId, userId, sourceEntityId: input.sourceEntityId, targetEntityId: input.targetEntityId })) {
      if (!this.isUuid(value)) throw new BadRequestException(`${name} must be a UUID`);
    }
    const type = String(input.relationshipType ?? '').trim();
    if (!type || type.length > 120) throw new BadRequestException('relationshipType must be 1-120 characters');
    if (input.sourceEntityId === input.targetEntityId) throw new BadRequestException('sourceEntityId and targetEntityId must differ');
    const rows = await this.db.request<any[]>('relationships', {
      method: 'POST',
      body: JSON.stringify({
        id: randomUUID(), organization_id: organizationId, relationship_type: type,
        source_entity_id: input.sourceEntityId, target_entity_id: input.targetEntityId,
        properties: input.properties ?? {}, created_by: userId,
      }),
    });
    return rows[0];
  }

  async list(organizationId: string, entityId?: string, limit = 100) {
    const safeLimit = Math.min(Math.max(Number.isFinite(limit) ? limit : 100, 1), 500);
    const filters = [`organization_id=eq.${encodeURIComponent(organizationId)}`];
    if (entityId) {
      if (!this.isUuid(entityId)) throw new BadRequestException('entityId must be a UUID');
      filters.push(`or=(source_entity_id.eq.${encodeURIComponent(entityId)},target_entity_id.eq.${encodeURIComponent(entityId)})`);
    }
    return this.db.request<any[]>(`relationships?${filters.join('&')}&order=created_at.desc&limit=${safeLimit}`);
  }

  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}
