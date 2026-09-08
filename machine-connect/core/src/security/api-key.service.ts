import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
    if (cleanName.length > 120) throw new BadRequestException('name is too long');
    if (expiresAt) { const parsed = Date.parse(expiresAt); if (Number.isNaN(parsed)) throw new BadRequestException('Invalid expiresAt'); if (parsed <= Date.now()) throw new BadRequestException('expiresAt must be in the future'); }
    const secret = `mc_${randomBytes(32).toString('base64url')}`;
    const prefix = secret.slice(0, 15);
    const hash = createHash('sha256').update(secret).digest('hex');
    const rows = await this.db.request<any[]>('machine_connect_api_keys', { method: 'POST', body: JSON.stringify({ organization_id: organizationId, name: cleanName, key_prefix: prefix, secret_hash: hash, created_by: createdBy, expires_at: expiresAt ?? null }) });
    await this.securityEvents.record({ organizationId, actorId: createdBy, eventType: 'api_key.created', severity: 'info', resourceType: 'api_key', resourceId: rows?.[0]?.id, metadata: { keyPrefix: prefix, name: cleanName } });
    return { key: secret, metadata: rows?.[0] ?? null };
  }

  async authenticate(secret: string) {
    if (!secret || !this.db.enabled) throw new UnauthorizedException('Invalid API key');
    const hash = createHash('sha256').update(secret).digest('hex');
    const rows = await this.db.request<any[]>(`machine_connect_api_keys?secret_hash=eq.${encodeURIComponent(hash)}&enabled=eq.true&select=id,organization_id,created_by,expires_at&limit=1`);
    const key = rows?.[0];
    if (!key || (key.expires_at && Date.parse(key.expires_at) <= Date.now())) throw new UnauthorizedException('Invalid or expired API key');
    await this.db.request(`machine_connect_api_keys?id=eq.${encodeURIComponent(key.id)}&organization_id=eq.${encodeURIComponent(key.organization_id)}`, { method: 'PATCH', body: JSON.stringify({ last_used_at: new Date().toISOString() }) });
    await this.securityEvents.record({ organizationId: key.organization_id, actorId: key.created_by, eventType: 'api_key.used', severity: 'info', resourceType: 'api_key', resourceId: key.id, metadata: {} });
    return { keyId: key.id, organizationId: key.organization_id, actorId: `api-key:${key.id}` };
  }

  async revoke(organizationId: string, id: string, actorId?: string) {
    this.assertUuid(organizationId); this.assertUuid(id); if (actorId) this.assertUuid(actorId);
    const existing = await this.db.request<any[]>(`machine_connect_api_keys?id=eq.${id}&organization_id=eq.${organizationId}&select=id,enabled&limit=1`);
    if (!existing?.length) throw new NotFoundException('API key not found');
    if (!existing[0].enabled) return existing;
    const result = await this.db.request<any[]>(`machine_connect_api_keys?id=eq.${id}&organization_id=eq.${organizationId}`, { method: 'PATCH', body: JSON.stringify({ enabled: false, revoked_at: new Date().toISOString() }) });
    await this.securityEvents.record({ organizationId, actorId, eventType: 'api_key.revoked', severity: 'warn', resourceType: 'api_key', resourceId: id });
    return result;
  }

  async rotate(organizationId: string, id: string, actorId: string) {
    this.assertUuid(organizationId); this.assertUuid(id); this.assertUuid(actorId);
    const rows = await this.db.request<any[]>(`machine_connect_api_keys?id=eq.${id}&organization_id=eq.${organizationId}&select=name,enabled&limit=1`);
    if (!rows?.length) throw new NotFoundException('API key not found');
    if (!rows[0].enabled) throw new BadRequestException('Cannot rotate a revoked API key');
    await this.revoke(organizationId, id, actorId);
    const rotated = await this.create(organizationId, actorId, String(rows[0].name ?? 'rotated-key'));
    await this.securityEvents.record({ organizationId, actorId, eventType: 'api_key.rotated', severity: 'info', resourceType: 'api_key', resourceId: id, metadata: { replacementKeyId: rotated.metadata?.id ?? null } });
    return rotated;
  }

  private assertUuid(value: string) { if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new BadRequestException('Invalid UUID'); }
}
