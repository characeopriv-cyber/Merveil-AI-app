import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SupabaseRest } from '../persistence/supabase-rest';

const ALLOWED_MIME = new Set(['application/pdf', 'text/plain']);
const MAX_BYTES = 25 * 1024 * 1024;

@Injectable()
export class DocumentService {
  constructor(private readonly db: SupabaseRest) {}

  async create(organizationId: string, userId: string, input: { title: string; storagePath: string; mimeType: string; sizeBytes?: number }) {
    const title = String(input.title ?? '').trim();
    const storagePath = String(input.storagePath ?? '').trim();
    const mimeType = String(input.mimeType ?? '').trim().toLowerCase();
    const sizeBytes = Number(input.sizeBytes ?? 0);
    if (!title || title.length > 500) throw new BadRequestException('Invalid document title');
    if (!storagePath || storagePath.length > 2000) throw new BadRequestException('Invalid storage path');
    if (!ALLOWED_MIME.has(mimeType)) throw new BadRequestException('Only PDF and text documents are supported');
    if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 0 || sizeBytes > MAX_BYTES) throw new BadRequestException('Document exceeds 25 MB limit');

    return this.db.request('ontology_documents', {
      method: 'POST',
      body: JSON.stringify({ id: randomUUID(), organization_id: organizationId, created_by: userId, title, storage_path: storagePath, mime_type: mimeType, size_bytes: sizeBytes, status: 'queued' }),
    });
  }

  async list(organizationId: string, limit = 100) {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 500);
    return this.db.request(`ontology_documents?organization_id=eq.${encodeURIComponent(organizationId)}&select=id,title,mime_type,size_bytes,status,created_at,updated_at&order=created_at.desc&limit=${safeLimit}`);
  }

  async get(organizationId: string, documentId: string) {
    return this.db.request(`ontology_documents?id=eq.${encodeURIComponent(documentId)}&organization_id=eq.${encodeURIComponent(organizationId)}&select=*`);
  }
}
