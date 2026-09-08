import { Injectable, Logger } from '@nestjs/common';
import { SupabaseRest } from '../persistence/supabase-rest';

@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);
  private running = false;

  constructor(private readonly db: SupabaseRest) {}

  async processNext(limit = 10): Promise<number> {
    if (this.running) return 0;
    this.running = true;
    let processed = 0;
    try {
      const safeLimit = Math.min(Math.max(Math.trunc(limit || 10), 1), 25);
      const queued = await this.db.request<any[]>(`ontology_documents?status=eq.queued&select=id,organization_id,storage_path,file_name,mime_type,byte_size,metadata&order=created_at.asc&limit=${safeLimit}`);
      for (const document of queued) {
        try {
          const claimed = await this.db.request<any[]>(`ontology_documents?id=eq.${encodeURIComponent(document.id)}&status=eq.queued`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'processing', updated_at: new Date().toISOString() }),
          });
          if (!claimed?.length) continue;
          // Extraction/NLP is performed by the isolated Intelligence Runtime.
          // This control-plane worker only owns lifecycle state and never machine commands.
          processed += 1;
        } catch (error) {
          this.logger.error(`Document ${document.id} processing failed`, error instanceof Error ? error.stack : String(error));
          await this.db.request(`ontology_documents?id=eq.${encodeURIComponent(document.id)}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: 'failed', extraction_error: 'processor failure', updated_at: new Date().toISOString() }),
          }).catch(() => undefined);
        }
      }
      return processed;
    } finally {
      this.running = false;
    }
  }
}
