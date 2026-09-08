import { Injectable } from '@nestjs/common';
import type { ConnectorProtocol } from './connector.service';

export interface ConnectorProviderDefinition {
  provider: string;
  displayName: string;
  protocols: ConnectorProtocol[];
  capabilities: string[];
  requiresSecret: boolean;
}

const DEFINITIONS: ConnectorProviderDefinition[] = [
  { provider: 'http.generic', displayName: 'Generic HTTP', protocols: ['https'], capabilities: ['telemetry.read', 'command.execute'], requiresSecret: false },
  { provider: 'mqtt.generic', displayName: 'Generic MQTT', protocols: ['mqtt'], capabilities: ['telemetry.read', 'command.execute'], requiresSecret: true },
  { provider: 'opcua.generic', displayName: 'Generic OPC UA', protocols: ['opcua'], capabilities: ['telemetry.read', 'command.execute'], requiresSecret: true },
  { provider: 'modbus.generic', displayName: 'Generic Modbus', protocols: ['modbus'], capabilities: ['telemetry.read', 'command.execute'], requiresSecret: false },
  { provider: 'websocket.generic', displayName: 'Generic WebSocket', protocols: ['websocket'], capabilities: ['telemetry.read', 'command.execute'], requiresSecret: false },
  { provider: 'custom', displayName: 'Custom Provider', protocols: ['custom'], capabilities: ['telemetry.read'], requiresSecret: true },
];

@Injectable()
export class ConnectorRegistry {
  list(): ConnectorProviderDefinition[] {
    return DEFINITIONS.map((definition) => ({ ...definition, protocols: [...definition.protocols], capabilities: [...definition.capabilities] }));
  }

  get(provider: string): ConnectorProviderDefinition | undefined {
    return this.list().find((definition) => definition.provider === provider);
  }
}
