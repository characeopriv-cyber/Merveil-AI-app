import test from 'node:test';
import assert from 'node:assert/strict';
import { requirePrincipal } from './principal';

test('missing authentication is rejected', () => {
  assert.throws(() => requirePrincipal(undefined), /Authenticated principal required/);
});

test('authenticated principal is accepted', () => {
  assert.deepEqual(requirePrincipal({ actorId: 'a', tenantId: 't', roles: ['operator'], authenticated: true }), { actorId: 'a', tenantId: 't', roles: ['operator'], authenticated: true });
});
