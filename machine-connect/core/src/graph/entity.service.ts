import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SupabaseRest } from '../persistence/supabase-rest';

export type EntityInput = { entityTypeId: string; displayName: string; properties?: Record<string, unknown> };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class EntityService {
  constructor(private readonly db: SupabaseRest) {}
  async create(org: string, user: string, input: EntityInput) { this.check(org,'organizationId'); this.check(user,'userId'); this.check(input.entityTypeId,'entityTypeId'); const name=String(input.displayName??'').trim(); if(!name||name.length>240) throw new BadRequestException('displayName must be 1-240 characters'); const rows=await this.db.request<any[]>('entities',{method:'POST',body:JSON.stringify({id:randomUUID(),entity_type_id:input.entityTypeId,organization_id:org,display_name:name,properties:input.properties??{},created_by:user})}); return rows[0]; }
  async get(org:string,id:string){this.check(id,'entityId'); const rows=await this.db.request<any[]>(`entities?id=eq.${encodeURIComponent(id)}&organization_id=eq.${encodeURIComponent(org)}&select=*,entity_types(name)`); if(!rows.length) throw new NotFoundException('Entity not found'); return rows[0];}
  async search(org:string,q='',typeId?:string,limit=50){this.check(org,'organizationId'); const safe=Math.min(Math.max(Number.isFinite(limit)?Math.trunc(limit):50,1),200); const p=new URLSearchParams({organization_id:`eq.${org}`,limit:String(safe),order:'updated_at.desc',select:'*,entity_types(name)'}); if(typeId){this.check(typeId,'entityTypeId');p.set('entity_type_id',`eq.${typeId}`);} const terms=String(q).trim(); if(terms)p.set('search_vector',`fts.${terms}`); return this.db.request<any[]>(`entities?${p.toString()}`);}
  async graph(org:string,id:string,depth=2){this.check(id,'entityId'); const d=Math.min(Math.max(Number.isFinite(depth)?Math.trunc(depth):2,0),6); return this.db.request<any[]>('rpc/get_entity_graph_workspace',{method:'POST',body:JSON.stringify({p_entity_id:id,p_depth:d,p_org_id:org})});}
  private check(v:string,f:string){if(!UUID.test(v))throw new BadRequestException(`${f} must be a UUID`);}
}
