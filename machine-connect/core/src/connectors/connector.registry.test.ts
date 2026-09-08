import { ConnectorRegistry } from './connector.registry';

describe('ConnectorRegistry', () => {
  it('exposes safe generic provider definitions without secrets', () => {
    const registry = new ConnectorRegistry();
    const definitions = registry.list();
    expect(definitions.map((item) => item.provider)).toEqual(expect.arrayContaining(['http.generic', 'mqtt.generic', 'opcua.generic', 'modbus.generic', 'websocket.generic', 'custom']));
    expect(definitions.every((item) => item.protocols.length > 0)).toBe(true);
    expect(JSON.stringify(definitions)).not.toContain('password');
    expect(registry.get('mqtt.generic')?.requiresSecret).toBe(true);
  });
});
