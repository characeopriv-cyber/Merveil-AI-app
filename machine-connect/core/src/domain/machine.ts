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
