import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
import { SupabaseRest } from '../persistence/supabase-rest';

export type ConnectorStatus = 'disabled' | 'pending' | 'active' | 'error' | 'revoked';
export type ConnectorProtocol = 'https' | 'mqtt' | 'websocket' | 'tcp' | 'udp' | 'modbus' | 'opcua' | 'custom';
export type ConnectorAuthMode = 'managed' | 'api_key' | 'oauth2' | 'mtls' | 'machine_credential' | 'none';
export type ConnectorHealth = 'unknown' | 'healthy' | 'degraded' | 'unreachable' | 'blocked';

export interface ConnectorInput {
  name: string;
  provider: string;
  protocol?: ConnectorProtocol;
  endpoint?: string;
  authMode?: ConnectorAuthMode;
  secretRef?: string;
  capabilities?: string[];
  configuration?: Record<string, unknown>;
}

@Injectable()
export class ConnectorService {
  constructor(private readonly db: SupabaseRest) {}

  private validate(input: ConnectorInput): void {
    if (!input.name?.trim() || input.name.trim().length > 120) throw new BadRequestException('Connector name must be 1-120 characters');
    if (!/^[a-z0-9][a-z0-9._-]{1,79}$/.test(input.provider ?? '')) throw new BadRequestException('Invalid connector provider');
    if (input.secretRef && /^(mc_|sk-|eyJ)/.test(input.secretRef)) throw new BadRequestException('secretRef must reference managed secret storage, not contain a credential');
    if (input.endpoint && !/^https?:\/\//i.test(input.endpoint) && input.protocol === 'https') throw new BadRequestException('HTTPS connectors require an http(s) endpoint');
  }

  private async event(organizationId: string, connectorId: string, eventType: string, actorId: string, metadata: Record<string, unknown> = {}): Promise<void> {
    if (!this.db.enabled) return;
    await this.db.request('machine_connect_connector_events', { method: 'POST', body: JSON.stringify({ id: randomUUID(), organization_id: organizationId, connector_id: connectorId, event_type: eventType, actor_id: actorId, metadata }) });
  }

  async list(organizationId: string, limit = 100): Promise<unknown[]> {
    if (!this.db.enabled) return [];
    const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit || 100)));
    return this.db.request<any[]>(`machine_connect_connector_instances?organization_id=eq.${encodeURIComponent(organizationId)}&select=id,name,provider,protocol,status,endpoint,auth_mode,secret_ref,capabilities,configuration,last_error,last_connected_at,last_health_check_at,last_latency_ms,health_status,created_by,created_at,updated_at&order=updated_at.desc&limit=${safeLimit}`);
  }

  async get(organizationId: string, id: string): Promise<any> {
    if (!this.db.enabled) throw new NotFoundException('Connector not found');
    const rows = await this.db.request<any[]>(`machine_connect_connector_instances?id=eq.${encodeURIComponent(id)}&organization_id=eq.${encodeURIComponent(organizationId)}&select=*`);
    if (!rows[0]) throw new NotFoundException('Connector not found');
    return rows[0];
  }

  async create(organizationId: string, actorId: string, input: ConnectorInput): Promise<any> {
    this.validate(input);
    if (!this.db.enabled) throw new Error('Supabase persistence is not configured');
    const rows = await this.db.request<any[]>('machine_connect_connector_instances', {
      method: 'POST',
      body: JSON.stringify({ organization_id: organizationId, created_by: actorId, name: input.name.trim(), provider: input.provider.toLowerCase(), protocol: input.protocol ?? 'https', endpoint: input.endpoint?.trim() || null, auth_mode: input.authMode ?? 'managed', secret_ref: input.secretRef?.trim() || null, capabilities: input.capabilities ?? [], configuration: input.configuration ?? {}, status: 'pending' }),
    });
    const connector = rows[0];
    await this.event(organizationId, connector.id, 'created', actorId, { provider: connector.provider });
    return connector;
  }

  async setStatus(organizationId: string, actorId: string, id: string, status: ConnectorStatus, error?: string): Promise<any> {
    const current = await this.get(organizationId, id);
    const rows = await this.db.request<any[]>(`machine_connect_connector_instances?id=eq.${encodeURIComponent(id)}&organization_id=eq.${encodeURIComponent(organizationId)}`, { method: 'PATCH', body: JSON.stringify({ status, last_error: error ?? null, last_connected_at: status === 'active' ? new Date().toISOString() : current.last_connected_at }) });
    const connector = rows[0] ?? await this.get(organizationId, id);
    const eventType = status === 'active' ? 'enabled' : status === 'disabled' ? 'disabled' : status === 'revoked' ? 'revoked' : status === 'error' ? 'failed' : 'connected';
    await this.event(organizationId, id, eventType, actorId, error ? { error } : {});
    return connector;
  }

  async healthCheck(organizationId: string, actorId: string, id: string): Promise<{ id: string; healthStatus: ConnectorHealth; latencyMs: number | null }> {
    const connector = await this.get(organizationId, id);
    const checkedAt = new Date().toISOString();
    if (connector.status === 'revoked' || connector.status === 'disabled') {
      await this.persistHealth(organizationId, id, 'blocked', null, checkedAt, 'connector_disabled_or_revoked');
      return { id, healthStatus: 'blocked', latencyMs: null };
    }
    if (connector.protocol !== 'https' || !connector.endpoint) {
      await this.persistHealth(organizationId, id, 'unknown', null, checkedAt, 'active_health_probe_not_supported_for_protocol');
      return { id, healthStatus: 'unknown', latencyMs: null };
    }

    const url = new URL(connector.endpoint);
    if (url.protocol !== 'https:') {
      await this.persistHealth(organizationId, id, 'blocked', null, checkedAt, 'health_probe_requires_https');
      return { id, healthStatus: 'blocked', latencyMs: null };
    }
    const host = url.hostname.toLowerCase();
    if (this.isPrivateHost(host)) {
      await this.persistHealth(organizationId, id, 'blocked', null, checkedAt, 'private_or_local_destination_blocked');
      return { id, healthStatus: 'blocked', latencyMs: null };
    }

    const started = Date.now();
    try {
      const response = await fetch(url, { method: 'HEAD', redirect: 'manual', headers: { 'user-agent': 'Machine-Connect-Health/1.0' }, signal: AbortSignal.timeout(5000) });
      const latencyMs = Date.now() - started;
      const healthStatus: ConnectorHealth = response.status >= 200 && response.status < 400 ? (latencyMs > 1500 ? 'degraded' : 'healthy') : response.status >= 400 && response.status < 500 ? 'degraded' : 'unreachable';
      await this.persistHealth(organizationId, id, healthStatus, latencyMs, checkedAt, `http_${response.status}`);
      await this.event(organizationId, id, healthStatus === 'healthy' ? 'connected' : healthStatus === 'unreachable' ? 'disconnected' : 'failed', actorId, { status: response.status, latency_ms: latencyMs });
      return { id, healthStatus, latencyMs };
    } catch (error) {
      const latencyMs = Date.now() - started;
      await this.persistHealth(organizationId, id, 'unreachable', latencyMs, checkedAt, error instanceof Error ? error.message.slice(0, 200) : 'health_probe_failed');
      await this.event(organizationId, id, 'failed', actorId, { latency_ms: latencyMs });
      return { id, healthStatus: 'unreachable', latencyMs };
    }
  }

  private async persistHealth(organizationId: string, id: string, healthStatus: ConnectorHealth, latencyMs: number | null, checkedAt: string, error?: string): Promise<void> {
    if (!this.db.enabled) return;
    await this.db.request(`machine_connect_connector_instances?id=eq.${encodeURIComponent(id)}&organization_id=eq.${encodeURIComponent(organizationId)}`, { method: 'PATCH', body: JSON.stringify({ health_status: healthStatus, last_latency_ms: latencyMs, last_health_check_at: checkedAt, last_error: healthStatus === 'healthy' ? null : error ?? null, updated_at: checkedAt }) });
  }

  private isPrivateHost(host: string): boolean {
    if (host === 'localhost' || host.endsWith('.localhost') || host === '0.0.0.0' || host === '::' || host === '::1') return true;
    const ipVersion = isIP(host);
    if (ipVersion === 4) {
      const [a, b] = host.split('.').map(Number);
      return a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
    }
    if (ipVersion === 6) return host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe8') || host.startsWith('fe9') || host.startsWith('fea') || host.startsWith('feb');
    return false;
  }

  async remove(organizationId: string, actorId: string, id: string): Promise<{ id: string; revoked: true }> {
    await this.get(organizationId, id);
    await this.setStatus(organizationId, actorId, id, 'revoked');
    return { id, revoked: true };
  }
}
