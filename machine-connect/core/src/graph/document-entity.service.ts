import { BadRequestException, Injectable } from '@nestjs/common';
import { SupabaseRest } from '../persistence/supabase-rest';

@Injectable()
export class DocumentEntityService {
  constructor(private readonly db: SupabaseRest) {}

  async link(organizationId: string, documentId: string, entityId: string, confidence = 1, mentionCount = 1) {
    if (!documentId || !entityId) throw new BadRequestException('documentId and entityId are required');
    const safeConfidence = Math.min(Math.max(Number(confidence), 0), 1);
    const safeMentions = Math.max(Math.trunc(Number(mentionCount)), 1);
    return this.db.request('ontology_document_entities', {
      method: 'POST',
      body: JSON.stringify({ organization_id: organizationId, document_id: documentId, entity_id: entityId, confidence: safeConfidence, mention_count: safeMentions }),
    });
  }

  async listByDocument(organizationId: string, documentId: string, limit = 500) {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 5000);
    return this.db.request(`ontology_document_entities?organization_id=eq.${encodeURIComponent(organizationId)}&document_id=eq.${encodeURIComponent(documentId)}&select=id,document_id,entity_id,mention_count,confidence,created_at&order=confidence.desc&limit=${safeLimit}`);
  }

  async listByEntity(organizationId: string, entityId: string, limit = 500) {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 5000);
    return this.db.request(`ontology_document_entities?organization_id=eq.${encodeURIComponent(organizationId)}&entity_id=eq.${encodeURIComponent(entityId)}&select=id,document_id,entity_id,mention_count,confidence,created_at&order=created_at.desc&limit=${safeLimit}`);
  }
}
