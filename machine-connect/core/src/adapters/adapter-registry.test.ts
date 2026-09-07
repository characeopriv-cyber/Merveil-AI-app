import test from 'node:test';
import assert from 'node:assert/strict';
import { AdapterRegistry } from './adapter-registry';

const adapter = {
  id: 'test-mqtt',
  protocol: 'mqtt',
  connect: async () => undefined,
  disconnect: async () => undefined,
  publishTelemetry: async () => undefined,
  dispatchCommand: async () => undefined,
};

test('adapter registry registers and resolves adapters', () => {
  const registry = new AdapterRegistry();
  registry.register(adapter);
  assert.equal(registry.has('test-mqtt'), true);
  assert.deepEqual(registry.list(), [{ id: 'test-mqtt', protocol: 'mqtt' }]);
  assert.equal(registry.get('test-mqtt'), adapter);
});

test('adapter registry rejects duplicate adapter ids', () => {
  const registry = new AdapterRegistry();
  registry.register(adapter);
  assert.throws(() => registry.register(adapter), /already registered/);
});
