import test from 'node:test';
import assert from 'node:assert/strict';
import { hasPermission } from './permissions';

test('scoped API key only grants declared permissions', () => {
  const principal: any = { actorId: 'api-key:test', tenantId: '00000000-0000-4000-8000-000000000001', roles: ['operator'], authenticated: true, permissions: ['graph.analyze'] };
  assert.equal(hasPermission(principal, 'graph.analyze'), true);
  assert.equal(hasPermission(principal, 'ontology.write'), false);
});
