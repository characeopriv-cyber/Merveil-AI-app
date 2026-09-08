import { Injectable, Logger } from '@nestjs/common';
import { SupabaseRest } from '../persistence/supabase-rest';
import { IntelligenceRuntimeClient } from './intelligence-runtime.client';

@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);
  private running = false;

  constructor(private readonly db: SupabaseRest, private readonly runtime: IntelligenceRuntimeClient) {}

  async processNext(limit = 10): Promise<number> {
    if (this.running) return 0;
    this.running = true;
    let processed = 0;
    try {
      const safeLimit = Math.min(Math.max(Math.trunc(limit || 10), 1), 25);
      const queued = await this.db.request<any[]>(`ontology_documents?status=eq.queued&select=id,organization_id,storage_path,file_name,mime_type,byte_size,metadata&order=created_at.asc&limit=${safeLimit}`);
      for (const document of queued) {
        const claimed = await this.db.request<any[]>(`ontology_documents?id=eq.${encodeURIComponent(document.id)}&status=eq.queued`, { method: 'PATCH', body: JSON.stringify({ status: 'processing', updated_at: new Date().toISOString() }) });
        if (!claimed?.length) continue;
        try {
          const bytes = await this.download(document.storage_path);
          if (bytes.byteLength > 25 * 1024 * 1024) throw new Error('Document exceeds 25 MB limit');
          const result = await this.runtime.extract(document.mime_type, bytes);
          if (result.byteSize !== bytes.byteLength) throw new Error('Runtime byte-size mismatch');
          await this.db.request(`ontology_documents?id=eq.${encodeURIComponent(document.id)}&organization_id=eq.${encodeURIComponent(document.organization_id)}&status=eq.processing`, { method: 'PATCH', body: JSON.stringify({ status: 'completed', extracted_text: result.text, extraction_error: null, metadata: { ...(document.metadata ?? {}), sha256: result.sha256, extracted_entities: result.entities, processed_at: new Date().toISOString() }, updated_at: new Date().toISOString() }) });
          processed += 1;
        } catch (error) {
          this.logger.error(`Document ${document.id} processing failed`, error instanceof Error ? error.stack : String(error));
          await this.db.request(`ontology_documents?id=eq.${encodeURIComponent(document.id)}&organization_id=eq.${encodeURIComponent(document.organization_id)}&status=eq.processing`, { method: 'PATCH', body: JSON.stringify({ status: 'failed', extraction_error: error instanceof Error ? error.message.slice(0, 500) : 'processor failure', updated_at: new Date().toISOString() }) }).catch(() => undefined);
        }
      }
      return processed;
    } finally { this.running = false; }
  }

  private async download(storagePath: string): Promise<Uint8Array> {
    const base = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.MC_DOCUMENT_STORAGE_BUCKET ?? 'machine-connect-documents';
    const path = String(storagePath ?? '').replace(/^\/+/, '');
    if (!base || !key || !bucket || !path || path.includes('..')) throw new Error('Invalid document storage configuration/path');
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    const response = await fetch(`${base}/storage/v1/object/authenticated/${encodeURIComponent(bucket)}/${encodedPath}`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(60_000) });
    if (!response.ok) throw new Error(`Document storage ${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  }
}
