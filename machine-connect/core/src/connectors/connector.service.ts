import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SupabaseRest } from '../persistence/supabase-rest';

export type ConnectorStatus = 'disabled' | 'pending' | 'active' | 'error' | 'revoked';
export type ConnectorProtocol = 'https' | 'mqtt' | 'websocket' | 'tcp' | 'udp' | 'modbus' | 'opcua' | 'custom';
export type ConnectorAuthMode = 'managed' | 'api_key' | 'oauth2' | 'mtls' | 'machine_credential' | 'none';

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
    return this.db.request<any[]>(`machine_connect_connector_instances?organization_id=eq.${encodeURIComponent(organizationId)}&select=id,name,provider,protocol,status,endpoint,auth_mode,secret_ref,capabilities,configuration,last_error,last_connected_at,created_by,created_at,updated_at&order=updated_at.desc&limit=${safeLimit}`);
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

  async remove(organizationId: string, actorId: string, id: string): Promise<{ id: string; revoked: true }> {
    await this.get(organizationId, id);
    await this.setStatus(organizationId, actorId, id, 'revoked');
    return { id, revoked: true };
  }
}
