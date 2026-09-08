import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SupabaseRest } from '../persistence/supabase-rest';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TYPES=new Set(['document_extract','connector_sync','graph_refresh']);

@Injectable()
export class IntelligenceJobService {
  constructor(private readonly db: SupabaseRest) {}
  async enqueue(org:string, actor:string, input:{jobType:string;documentId?:string;connectorId?:string;payload?:Record<string,unknown>}) {
    if(!UUID.test(org)||!UUID.test(actor)) throw new BadRequestException('Invalid tenant or actor');
    if(!TYPES.has(input.jobType)) throw new BadRequestException('Unsupported intelligence job type');
    if(input.documentId&&!UUID.test(input.documentId)) throw new BadRequestException('Invalid documentId');
    if(input.connectorId&&!UUID.test(input.connectorId)) throw new BadRequestException('Invalid connectorId');
    const rows=await this.db.request<any[]>('machine_connect_intelligence_jobs',{method:'POST',body:JSON.stringify({id:randomUUID(),organization_id:org,created_by:actor,job_type:input.jobType,document_id:input.documentId??null,connector_id:input.connectorId??null,payload:input.payload??{},status:'queued'})});
    return rows[0];
  }
  async list(org:string,limit=50){const safe=Math.min(Math.max(Math.trunc(limit||50),1),200);return this.db.request<any[]>(`machine_connect_intelligence_jobs?organization_id=eq.${encodeURIComponent(org)}&select=id,document_id,connector_id,job_type,status,attempts,error,created_at,started_at,completed_at,updated_at&order=created_at.desc&limit=${safe}`);}
  async get(org:string,id:string){if(!UUID.test(id))throw new BadRequestException('Invalid job id');const rows=await this.db.request<any[]>(`machine_connect_intelligence_jobs?id=eq.${id}&organization_id=eq.${encodeURIComponent(org)}&select=*`);if(!rows[0])throw new NotFoundException('Job not found');return rows[0];}
}
