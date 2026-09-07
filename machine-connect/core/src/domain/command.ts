export type CommandStatus =
  | 'requested'
  | 'authorized'
  | 'approval_required'
  | 'approved'
  | 'dispatched'
  | 'acknowledged'
  | 'rejected'
  | 'timed_out'
  | 'failed'
  | 'cancelled'
  | 'emergency_stopped';

export interface MachineCommand {
  commandId: string;
  tenantId: string;
  machineId: string;
  capability: string;
  parameters: Record<string, unknown>;
  requestedBy: string;
  requestedAt: string;
  idempotencyKey: string;
  status: CommandStatus;
}

const transitions: Record<CommandStatus, CommandStatus[]> = {
  requested: ['authorized', 'approval_required', 'rejected', 'cancelled', 'failed'],
  authorized: ['approved', 'dispatched', 'rejected', 'failed'],
  approval_required: ['approved', 'rejected', 'cancelled'],
  approved: ['dispatched', 'rejected', 'failed'],
  dispatched: ['acknowledged', 'timed_out', 'failed', 'emergency_stopped'],
  acknowledged: [],
  rejected: [],
  timed_out: [],
  failed: [],
  cancelled: [],
  emergency_stopped: [],
};

export function canTransition(from: CommandStatus, to: CommandStatus): boolean {
  return transitions[from].includes(to);
}
