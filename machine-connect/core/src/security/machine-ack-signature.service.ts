import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, verify, KeyObject } from 'node:crypto';
import { SupabaseRest } from '../persistence/supabase-rest';

const MAX_SKEW_MS = 60_000;
const NONCE_TTL_MS = 5 * 60_000;

type AckHeaders = {
  signature?: string;
  timestamp?: string;
  nonce?: string;
};

type CredentialRow = { public_key_pem?: string | null };

@Injectable()
export class MachineAckSignatureService {
  constructor(private readonly db: SupabaseRest) {}

  async verifyAndConsume(input: {
    tenantId: string;
    machineId: string;
    commandId: string;
    headers: AckHeaders;
  }): Promise<void> {
    const signature = input.headers.signature?.trim();
    const timestamp = input.headers.timestamp?.trim();
    const nonce = input.headers.nonce?.trim();
    if (!signature || !timestamp || !nonce) throw new UnauthorizedException('Signed machine ACK headers are required');
    if (!/^\d{10,13}$/.test(timestamp) || !/^[A-Za-z0-9_-]{16,128}$/.test(nonce)) {
      throw new UnauthorizedException('Invalid machine ACK timestamp or nonce');
    }

    const timestampMs = Number(timestamp.length === 10 ? `${timestamp}000` : timestamp);
    if (!Number.isSafeInteger(timestampMs) || Math.abs(Date.now() - timestampMs) > MAX_SKEW_MS) {
      throw new UnauthorizedException('Machine ACK timestamp is outside the allowed window');
    }
    if (!/^[A-Za-z0-9_-]{43,128}$/.test(signature)) throw new UnauthorizedException('Invalid machine ACK signature');

    if (!this.db.enabled) throw new UnauthorizedException('Signed machine ACK verification is not configured');
    const rows = await this.db.request<CredentialRow[]>(
      `machine_connect_credentials?machine_id=eq.${encodeURIComponent(input.machineId)}&organization_id=eq.${encodeURIComponent(input.tenantId)}&revoked_at=is.null&order=created_at.desc&limit=1&select=public_key_pem`,
    );
    const publicKey = rows[0]?.public_key_pem;
    if (!publicKey) throw new UnauthorizedException('Machine signing key is not registered');

    const canonical = `${input.machineId}.${input.commandId}.${timestamp}.${nonce}`;
    const digest = createHash('sha256').update(canonical).digest();
    let valid = false;
    try {
      valid = verify(null, digest, publicKey as KeyObject | string, Buffer.from(signature, 'base64url'));
    } catch {
      valid = false;
    }
    if (!valid) throw new UnauthorizedException('Invalid machine ACK signature');

    const expiresAt = new Date(Date.now() + NONCE_TTL_MS).toISOString();
    try {
      await this.db.request('machine_connect_ack_nonces', {
        method: 'POST',
        body: JSON.stringify({ organization_id: input.tenantId, machine_id: input.machineId, command_id: input.commandId, nonce, expires_at: expiresAt }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('23505') || message.includes('409') || message.includes('duplicate key')) {
        throw new UnauthorizedException('Machine ACK nonce has already been used');
      }
      throw error;
    }
  }
}
