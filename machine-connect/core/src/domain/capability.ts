export type CapabilitySafetyClass = 'read' | 'control' | 'critical';

export interface MachineCapability {
  id: string;
  machineType: string;
  name: string;
  version: string;
  safetyClass: CapabilitySafetyClass;
  parameterSchema?: Record<string, unknown>;
}
