import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { SupabaseRest } from '../persistence/supabase-rest';
import { SecurityEventService } from './security-event.service';

@Injectable()
export class ApiKeyService {
  constructor(private readonly db: SupabaseRest, private readonly securityEvents: SecurityEventService) {}

  async list(organizationId: string) {
    this.assertUuid(organizationId);
    return this.db.request<any[]>(`machine_connect_api_keys?organization_id=eq.${organizationId}&select=id,name,key_prefix,enabled,expires_at,last_used_at,created_at,revoked_at&order=created_at.desc`);
  }

  async create(organizationId: string, createdBy: string, name: string, expiresAt?: string) {
    this.assertUuid(organizationId); this.assertUuid(createdBy);
    const cleanName = String(name ?? '').trim();
    if (!cleanName) throw new BadRequestException('name is required');
    if (expiresAt && Number.isNaN(Date.parse(expiresAt))) throw new BadRequestException('Invalid expiresAt');
    const secret = `mc_${randomBytes(32).toString('base64url')}`;
    const prefix = secret.slice(0, 15);
    const hash = createHash('sha256').update(secret).digest('hex');
    const rows = await this.db.request<any[]>('machine_connect_api_keys', {
      method: 'POST',
      body: JSON.stringify({ organization_id: organizationId, name: cleanName, key_prefix: prefix, secret_hash: hash, created_by: createdBy, expires_at: expiresAt ?? null }),
    });
    await this.securityEvents.record({ organizationId, actorId: createdBy, eventType: 'api_key.created', severity: 'info', resourceType: 'api_key', resourceId: rows?.[0]?.id, metadata: { keyPrefix: prefix, name: cleanName } });
    return { key: secret, metadata: rows?.[0] ?? null };
  }

  async revoke(organizationId: string, id: string, actorId?: string) {
    this.assertUuid(organizationId); this.assertUuid(id);
    const result = await this.db.request<any[]>(`machine_connect_api_keys?id=eq.${id}&organization_id=eq.${organizationId}`, {
      method: 'PATCH', body: JSON.stringify({ enabled: false, revoked_at: new Date().toISOString() }),
    });
    await this.securityEvents.record({ organizationId, actorId, eventType: 'api_key.revoked', severity: 'warn', resourceType: 'api_key', resourceId: id });
    return result;
  }

  async rotate(organizationId: string, id: string, actorId: string) {
    this.assertUuid(organizationId); this.assertUuid(id); this.assertUuid(actorId);
    const rows = await this.db.request<any[]>(`machine_connect_api_keys?id=eq.${id}&organization_id=eq.${organizationId}&select=name&limit=1`);
    if (!rows?.length) throw new BadRequestException('API key not found');
    await this.revoke(organizationId, id, actorId);
    return this.create(organizationId, actorId, String(rows[0].name ?? 'rotated-key'));
  }

  private assertUuid(value: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new BadRequestException('Invalid UUID');
  }
}
