import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { SupabaseRest } from '../persistence/supabase-rest';

@Injectable()
export class ApiKeyService {
  constructor(private readonly db: SupabaseRest) {}

  async list(organizationId: string) {
    this.assertUuid(organizationId);
    return this.db.request<any[]>(`machine_connect_api_keys?organization_id=eq.${organizationId}&select=id,name,key_prefix,enabled,expires_at,last_used_at,created_at,revoked_at&order=created_at.desc`);
  }

  async create(organizationId: string, createdBy: string, name: string, expiresAt?: string) {
    this.assertUuid(organizationId); this.assertUuid(createdBy);
    const cleanName = String(name ?? '').trim();
    if (!cleanName) throw new BadRequestException('name is required');
    const secret = `mc_${randomBytes(32).toString('base64url')}`;
    const prefix = secret.slice(0, 15);
    const hash = createHash('sha256').update(secret).digest('hex');
    const rows = await this.db.request<any[]>('machine_connect_api_keys', {
      method: 'POST',
      body: JSON.stringify({ organization_id: organizationId, name: cleanName, key_prefix: prefix, secret_hash: hash, created_by: createdBy, expires_at: expiresAt ?? null }),
    });
    return { key: secret, metadata: rows?.[0] ?? null };
  }

  async revoke(organizationId: string, id: string) {
    this.assertUuid(organizationId); this.assertUuid(id);
    return this.db.request<any[]>(`machine_connect_api_keys?id=eq.${id}&organization_id=eq.${organizationId}`, {
      method: 'PATCH', body: JSON.stringify({ enabled: false, revoked_at: new Date().toISOString() }),
    });
  }

  private assertUuid(value: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new BadRequestException('Invalid UUID');
  }
}
