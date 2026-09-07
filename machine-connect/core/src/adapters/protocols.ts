export const SUPPORTED_MACHINE_PROTOCOLS = [
  'mqtt', 'http', 'websocket', 'modbus', 'opcua', 'ble', 'lorawan', 'can', 'tcp', 'serial', 'custom',
] as const;

export type SupportedMachineProtocol = typeof SUPPORTED_MACHINE_PROTOCOLS[number];

export function isSupportedMachineProtocol(value: string): value is SupportedMachineProtocol {
  return (SUPPORTED_MACHINE_PROTOCOLS as readonly string[]).includes(value.toLowerCase());
}
