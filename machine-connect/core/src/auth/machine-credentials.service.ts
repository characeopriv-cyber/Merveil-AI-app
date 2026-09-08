import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { SupabaseRest } from '../persistence/supabase-rest';
import { MachineService } from '../machine/machine.service';

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
  constructor(private readonly db: SupabaseRest, private readonly machines: MachineService) {}

  async issue(tenantId: string, machineId: string): Promise<{ machineId: string; credential: string }> {
    await this.machines.get(tenantId, machineId);
    const secret = `${PREFIX}${randomBytes(32).toString('base64url')}`;
    const salt = randomBytes(16);
    const hash = scryptSync(secret, salt, KEY_LENGTH).toString('base64url');

    if (this.db.enabled) {
      await this.db.request('machine_connect_credentials', {
        method: 'POST',
        body: JSON.stringify({ machine_id: machineId, organization_id: tenantId, secret_hash: hash, secret_salt: salt.toString('base64url') }),
      });
    }
    return { machineId, credential: secret };
  }

  async revoke(tenantId: string, machineId: string): Promise<{ machineId: string; revoked: boolean }> {
    await this.machines.get(tenantId, machineId);
    if (!this.db.enabled) return { machineId, revoked: false };
    await this.db.request(`machine_connect_credentials?machine_id=eq.${encodeURIComponent(machineId)}&organization_id=eq.${encodeURIComponent(tenantId)}&revoked_at=is.null`, { method: 'PATCH', body: JSON.stringify({ revoked_at: new Date().toISOString() }) });
    return { machineId, revoked: true };
  }

  async rotate(tenantId: string, machineId: string): Promise<{ machineId: string; credential: string }> {
    await this.revoke(tenantId, machineId);
    return this.issue(tenantId, machineId);
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

  async require(tenantId: string, machineId: string, credential: string): Promise<void> {
    if (!(await this.verify(tenantId, machineId, credential))) throw new UnauthorizedException('Invalid or revoked machine credential');
  }
}
