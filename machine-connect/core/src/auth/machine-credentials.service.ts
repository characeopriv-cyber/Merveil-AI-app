import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { SupabaseRest } from '../persistence/supabase-rest';
import { MachineService } from '../machine/machine.service';
import { SecurityEventService } from '../security/security-event.service';

const PREFIX = 'mc_';
const KEY_LENGTH = 32;

type CredentialRow = {
  machine_id: string;
  organization_id: string;
  secret_hash: string;
  secret_salt: string;
  revoked_at?: string | null;
};

@Injectable()
export class MachineCredentialsService {
  constructor(private readonly db: SupabaseRest, private readonly machines: MachineService, private readonly securityEvents: SecurityEventService) {}

  async issue(tenantId: string, machineId: string): Promise<{ machineId: string; credential: string }> {
    await this.machines.get(tenantId, machineId);
    const secret = `${PREFIX}${randomBytes(32).toString('base64url')}`;
    const salt = randomBytes(16);
    const hash = scryptSync(secret, salt, KEY_LENGTH).toString('base64url');
    if (this.db.enabled) {
      const rows = await this.db.request<any[]>('machine_connect_credentials', { method: 'POST', body: JSON.stringify({ machine_id: machineId, organization_id: tenantId, secret_hash: hash, secret_salt: salt.toString('base64url') }) });
      await this.securityEvents.record({ organizationId: tenantId, actorId: `machine:${machineId}`, eventType: 'machine_credential.issued', severity: 'info', resourceType: 'machine', resourceId: machineId, metadata: { credentialId: rows?.[0]?.id ?? null } });
    }
    return { machineId, credential: secret };
  }

  async revoke(tenantId: string, machineId: string): Promise<{ machineId: string; revoked: boolean }> {
    await this.machines.get(tenantId, machineId);
    if (!this.db.enabled) return { machineId, revoked: false };
    await this.db.request(`machine_connect_credentials?machine_id=eq.${encodeURIComponent(machineId)}&organization_id=eq.${encodeURIComponent(tenantId)}&revoked_at=is.null`, { method: 'PATCH', body: JSON.stringify({ revoked_at: new Date().toISOString() }) });
    await this.securityEvents.record({ organizationId: tenantId, actorId: `machine:${machineId}`, eventType: 'machine_credential.revoked', severity: 'warn', resourceType: 'machine', resourceId: machineId });
    return { machineId, revoked: true };
  }

  async rotate(tenantId: string, machineId: string): Promise<{ machineId: string; credential: string }> {
    await this.revoke(tenantId, machineId);
    const issued = await this.issue(tenantId, machineId);
    await this.securityEvents.record({ organizationId: tenantId, actorId: `machine:${machineId}`, eventType: 'machine_credential.rotated', severity: 'warn', resourceType: 'machine', resourceId: machineId });
    return issued;
  }

  async verify(tenantId: string, machineId: string, credential: string): Promise<boolean> {
    if (!credential.startsWith(PREFIX) || !this.db.enabled) return false;
    const rows = await this.db.request<CredentialRow[]>(`machine_connect_credentials?machine_id=eq.${encodeURIComponent(machineId)}&organization_id=eq.${encodeURIComponent(tenantId)}&revoked_at=is.null&order=created_at.desc&limit=1`);
    if (!rows.length) return false;
    const row = rows[0];
    const supplied = scryptSync(credential, Buffer.from(row.secret_salt, 'base64url'), KEY_LENGTH);
    const stored = Buffer.from(row.secret_hash, 'base64url');
    return supplied.length === stored.length && timingSafeEqual(supplied, stored);
  }

  async authenticate(machineId: string, credential: string): Promise<string> {
    if (!credential.startsWith(PREFIX) || !this.db.enabled) throw new UnauthorizedException('Invalid or revoked machine credential');
    const rows = await this.db.request<CredentialRow[]>(`machine_connect_credentials?machine_id=eq.${encodeURIComponent(machineId)}&revoked_at=is.null&order=created_at.desc&limit=1`);
    const row = rows[0];
    if (!row?.organization_id || !(await this.verify(row.organization_id, machineId, credential))) throw new UnauthorizedException('Invalid or revoked machine credential');
    return row.organization_id;
  }

  async authenticateMqtt(machineIdentity: string, credential: string, clientId?: string): Promise<boolean> {
    const identity = machineIdentity.trim();
    const secret = credential.trim();
    if (!identity || !secret.startsWith(PREFIX) || !this.db.enabled) return false;
    if (clientId?.trim() && clientId.trim() !== identity) return false;

    const machines = await this.db.request<Array<{ id: string; organization_id: string; state: string }>>(
      `machine_connect_machines?machine_identity=eq.${encodeURIComponent(identity)}&limit=1&select=id,organization_id,state`,
    );
    const machine = machines[0];
    if (!machine || machine.state === 'revoked' || machine.state === 'quarantined') return false;

    return this.verify(machine.organization_id, machine.id, secret);
  }

  async require(tenantId: string, machineId: string, credential: string): Promise<void> {
    if (!(await this.verify(tenantId, machineId, credential))) throw new UnauthorizedException('Invalid or revoked machine credential');
  }
}
