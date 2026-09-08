import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiKeyService } from './api-key.service';

const org = '11111111-1111-4111-8111-111111111111';
const actor = '22222222-2222-4222-8222-222222222222';
const key = '33333333-3333-4333-8333-333333333333';

function service(overrides: Record<string, unknown> = {}) {
  const calls: Array<{ path: string; options?: any }> = [];
  const db = {
    request: async (path: string, options?: any) => {
      calls.push({ path, options });
      if (path.includes('select=name,enabled')) return [{ name: 'primary', enabled: true }];
      if (path.includes('select=id,enabled')) return [{ id: key, enabled: true }];
      if (path === 'machine_connect_api_keys') return [{ id: key }];
      return [];
    },
  };
  const events = { record: async (input: any) => { calls.push({ path: 'event', options: input }); } };
  return { instance: new ApiKeyService(db as any, events as any), calls, ...overrides };
}

test('rejects invalid API key name and expired timestamp', async () => {
  const { instance } = service();
  await assert.rejects(() => instance.create(org, actor, '   '), /name is required/);
  await assert.rejects(() => instance.create(org, actor, 'primary', '2000-01-01T00:00:00Z'), /expiresAt must be in the future/);
});

test('does not expose secret hash in list query', async () => {
  const { instance, calls } = service();
  await instance.list(org);
  const query = calls[0].path;
  assert.match(query, /key_prefix/);
  assert.doesNotMatch(query, /secret_hash/);
});

test('revoke is tenant scoped and idempotent for already revoked keys', async () => {
  const { instance } = service();
  await instance.revoke(org, key, actor);
  await assert.rejects(() => instance.revoke(org, '99999999-9999-4999-8999-999999999999', actor), /API key not found/);
});

test('rejects rotation of revoked keys', async () => {
  const db = {
    request: async (path: string) => path.includes('select=name,enabled') ? [{ name: 'revoked', enabled: false }] : [],
  };
  const events = { record: async () => undefined };
  const instance = new ApiKeyService(db as any, events as any);
  await assert.rejects(() => instance.rotate(org, key, actor), /Cannot rotate a revoked API key/);
});
