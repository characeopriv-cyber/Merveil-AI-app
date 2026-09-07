export type MachineLifecycleState =
  | 'provisioning'
  | 'active'
  | 'maintenance'
  | 'quarantined'
  | 'revoked';

export type MachineConnectionState = 'unknown' | 'online' | 'offline';

export interface Machine {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  manufacturer?: string;
  model?: string;
  firmwareVersion?: string;
  lifecycleState: MachineLifecycleState;
  connectionState: MachineConnectionState;
  lastHeartbeatAt?: string;
  adapterId?: string;
  capabilities: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MachineProvisioningInput {
  tenantId: string;
  name: string;
  type: string;
  manufacturer?: string;
  model?: string;
  firmwareVersion?: string;
  adapterId?: string;
  capabilities?: string[];
}

export const MACHINE_LIFECYCLE_TRANSITIONS: Record<MachineLifecycleState, readonly MachineLifecycleState[]> = {
  provisioning: ['active', 'quarantined', 'revoked'],
  active: ['maintenance', 'quarantined', 'revoked'],
  maintenance: ['active', 'quarantined', 'revoked'],
  quarantined: ['active', 'revoked'],
  revoked: [],
};

export function canTransitionMachine(from: MachineLifecycleState, to: MachineLifecycleState): boolean {
  return MACHINE_LIFECYCLE_TRANSITIONS[from].includes(to);
}
