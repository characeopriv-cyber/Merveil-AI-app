import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, sign } from 'node:crypto';
import { MachineAckSignatureService } from './machine-ack-signature.service';

function headers(machineId: string, commandId: string, privateKey: string, nonce = 'nonce_12345678901234', timestamp = String(Date.now())) {
  const canonical = `${machineId}.${commandId}.${timestamp}.${nonce}`;
  const digest = require('node:crypto').createHash('sha256').update(canonical).digest();
  return { signature: sign(null, digest, privateKey).toString('base64url'), timestamp, nonce };
}

test('accepts a valid machine-bound Ed25519 ACK and consumes its nonce', async () => {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
  const calls: string[] = [];
  const db = { enabled: true, request: async <T>(path: string, options?: { method?: string; body?: string }): Promise<T> => {
    calls.push(`${path}:${options?.method ?? 'GET'}`);
    if (path.startsWith('machine_connect_credentials?')) return [{ public_key_pem: publicKeyPem }] as T;
    return {} as T;
  } } as any;
  const service = new MachineAckSignatureService(db);
  const machineId = 'machine-1'; const commandId = 'command-1';
  await service.verifyAndConsume({ tenantId: 'tenant-1', machineId, commandId, headers: headers(machineId, commandId, privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()) });
  assert.equal(calls.length, 2);
});

test('rejects a replayed nonce', async () => {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const publicKeyPem = publicKey.export({ type: 'spki', format: 'pem' }).toString();
  let consumed = false;
  const db = { enabled: true, request: async <T>(path: string): Promise<T> => {
    if (path.startsWith('machine_connect_credentials?')) return [{ public_key_pem: publicKeyPem }] as T;
    if (consumed) throw new Error('409 duplicate key');
    consumed = true; return {} as T;
  } } as any;
  const service = new MachineAckSignatureService(db);
  const machineId = 'machine-1'; const commandId = 'command-1';
  const h = headers(machineId, commandId, privateKey.export({ type: 'pkcs8', format: 'pem' }).toString());
  await service.verifyAndConsume({ tenantId: 'tenant-1', machineId, commandId, headers: h });
  await assert.rejects(() => service.verifyAndConsume({ tenantId: 'tenant-1', machineId, commandId, headers: h }), /nonce has already been used/);
});

test('rejects stale ACK timestamps', async () => {
  const { privateKey } = generateKeyPairSync('ed25519');
  const privatePem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  const h = headers('machine-1', 'command-1', privatePem, 'nonce_12345678901235', String(Date.now() - 120_000));
  const service = new MachineAckSignatureService({ enabled: true, request: async () => [{ public_key_pem: 'unused' }] } as any);
  await assert.rejects(() => service.verifyAndConsume({ tenantId: 'tenant-1', machineId: 'machine-1', commandId: 'command-1', headers: h }), /outside the allowed window/);
});
