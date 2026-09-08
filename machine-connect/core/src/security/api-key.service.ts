import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { SupabaseRest } from '../persistence/supabase-rest';
import { SecurityEventService } from './security-event.service';

const ALLOWED_SCOPES = new Set(['ontology.read', 'ontology.write', 'graph.analyze', 'security.read', 'security.write']);

@Injectable()
export class ApiKeyService {
  constructor(private readonly db: SupabaseRest, private readonly securityEvents: SecurityEventService) {}

  async list(organizationId: string) {
    this.assertUuid(organizationId);
    return this.db.request<any[]>(`machine_connect_api_keys?organization_id=eq.${organizationId}&select=id,name,key_prefix,scopes,enabled,expires_at,last_used_at,created_at,revoked_at&order=created_at.desc`);
  }

  async create(organizationId: string, createdBy: string, name: string, expiresAt?: string, scopes?: string[]) {
    this.assertUuid(organizationId); this.assertUuid(createdBy);
    const cleanName = String(name ?? '').trim();
    if (!cleanName) throw new BadRequestException('name is required');
    if (cleanName.length > 120) throw new BadRequestException('name is too long');
    if (expiresAt) { const parsed = Date.parse(expiresAt); if (Number.isNaN(parsed)) throw new BadRequestException('Invalid expiresAt'); if (parsed <= Date.now()) throw new BadRequestException('expiresAt must be in the future'); }
    const cleanScopes = this.normalizeScopes(scopes);
    const secret = `mc_${randomBytes(32).toString('base64url')}`;
    const prefix = secret.slice(0, 15);
    const hash = createHash('sha256').update(secret).digest('hex');
    const rows = await this.db.request<any[]>('machine_connect_api_keys', { method: 'POST', body: JSON.stringify({ organization_id: organizationId, name: cleanName, key_prefix: prefix, secret_hash: hash, created_by: createdBy, scopes: cleanScopes, expires_at: expiresAt ?? null }) });
    await this.recordKeyEvent(organizationId, rows?.[0]?.id, 'created', { keyPrefix: prefix, scopes: cleanScopes });
    return { key: secret, metadata: rows?.[0] ?? null };
  }

  async authenticate(secret: string) {
    if (!secret || !this.db.enabled) throw new UnauthorizedException('Invalid API key');
    const hash = createHash('sha256').update(secret).digest('hex');
    const rows = await this.db.request<any[]>(`machine_connect_api_keys?secret_hash=eq.${encodeURIComponent(hash)}&enabled=eq.true&select=id,organization_id,created_by,scopes,expires_at&limit=1`);
    const key = rows?.[0];
    if (!key || (key.expires_at && Date.parse(key.expires_at) <= Date.now())) throw new UnauthorizedException('Invalid or expired API key');
    await this.db.request(`machine_connect_api_keys?id=eq.${encodeURIComponent(key.id)}&organization_id=eq.${encodeURIComponent(key.organization_id)}`, { method: 'PATCH', body: JSON.stringify({ last_used_at: new Date().toISOString() }) });
    await this.recordKeyEvent(key.organization_id, key.id, 'used', { scopes: this.normalizeScopes(key.scopes) });
    return { keyId: key.id, organizationId: key.organization_id, actorId: `api-key:${key.id}`, scopes: this.normalizeScopes(key.scopes) };
  }

  async revoke(organizationId: string, id: string, actorId?: string) {
    this.assertUuid(organizationId); this.assertUuid(id); if (actorId) this.assertUuid(actorId);
    const existing = await this.db.request<any[]>(`machine_connect_api_keys?id=eq.${id}&organization_id=eq.${organizationId}&select=id,enabled&limit=1`);
    if (!existing?.length) throw new NotFoundException('API key not found');
    if (!existing[0].enabled) return existing;
    const result = await this.db.request<any[]>(`machine_connect_api_keys?id=eq.${id}&organization_id=eq.${organizationId}`, { method: 'PATCH', body: JSON.stringify({ enabled: false, revoked_at: new Date().toISOString() }) });
    await this.recordKeyEvent(organizationId, id, 'revoked', { actorId: actorId ?? null });
    return result;
  }

  async rotate(organizationId: string, id: string, actorId: string) {
    this.assertUuid(organizationId); this.assertUuid(id); this.assertUuid(actorId);
    const rows = await this.db.request<any[]>(`machine_connect_api_keys?id=eq.${id}&organization_id=eq.${organizationId}&select=name,enabled,scopes&limit=1`);
    if (!rows?.length) throw new NotFoundException('API key not found');
    if (!rows[0].enabled) throw new BadRequestException('Cannot rotate a revoked API key');
    await this.revoke(organizationId, id, actorId);
    const rotated = await this.create(organizationId, actorId, String(rows[0].name ?? 'rotated-key'), undefined, this.normalizeScopes(rows[0].scopes));
    await this.recordKeyEvent(organizationId, id, 'rotated', { replacementKeyId: rotated.metadata?.id ?? null });
    return rotated;
  }

  private async recordKeyEvent(organizationId: string, apiKeyId: string | undefined, eventType: string, metadata: Record<string, unknown>) {
    if (!apiKeyId) return;
    await this.securityEvents.record({ organizationId, actorId: `api-key:${apiKeyId}`, eventType: `api_key.${eventType}`, severity: eventType === 'revoked' ? 'warn' : 'info', resourceType: 'api_key', resourceId: apiKeyId, metadata });
    if (this.db.enabled) await this.db.request('machine_connect_api_key_events', { method: 'POST', body: JSON.stringify({ organization_id: organizationId, api_key_id: apiKeyId, event_type: eventType, metadata }) });
  }

  private normalizeScopes(scopes?: unknown): string[] {
    if (!Array.isArray(scopes) || scopes.length === 0) return ['ontology.read'];
    const normalized = [...new Set(scopes.map(String))];
    if (normalized.some(scope => !ALLOWED_SCOPES.has(scope))) throw new BadRequestException('Invalid API-key scope');
    return normalized;
  }

  private assertUuid(value: string) { if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) throw new BadRequestException('Invalid UUID'); }
}
