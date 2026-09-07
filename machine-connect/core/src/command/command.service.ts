import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { MachineCommand, CommandStatus, canTransition } from '../domain/command';
import { MachineService } from '../machine/machine.service';
import { PolicyService } from '../safety/policy.service';

@Injectable()
export class CommandService {
  private readonly commands = new Map<string, MachineCommand>();
  private readonly idempotency = new Map<string, string>();

  constructor(
    private readonly machines: MachineService,
    private readonly policy: PolicyService,
  ) {}

  request(input: Omit<MachineCommand, 'commandId' | 'requestedAt' | 'status'> & { safetyClass?: 'read' | 'control' | 'critical'; capabilityKnown?: boolean }): MachineCommand {
    const key = `${input.tenantId}:${input.idempotencyKey}`;
    const existingId = this.idempotency.get(key);
    if (existingId) return this.commands.get(existingId)!;

    const machine = this.machines.get(input.tenantId, input.machineId);
    const decision = this.policy.evaluate({
      lifecycleState: machine.lifecycleState,
      capabilitySafetyClass: input.safetyClass ?? 'control',
      capabilityKnown: input.capabilityKnown ?? false,
      actorAuthorized: Boolean(input.requestedBy),
    });

    const status: CommandStatus = !decision.allowed
      ? 'rejected'
      : decision.approvalRequired
        ? 'approval_required'
        : 'authorized';

    const command: MachineCommand = {
      commandId: randomUUID(),
      tenantId: input.tenantId,
      machineId: input.machineId,
      capability: input.capability,
      parameters: input.parameters,
      requestedBy: input.requestedBy,
      requestedAt: new Date().toISOString(),
      idempotencyKey: input.idempotencyKey,
      status,
    };
    this.commands.set(command.commandId, command);
    this.idempotency.set(key, command.commandId);
    return command;
  }

  transition(commandId: string, to: CommandStatus): MachineCommand {
    const command = this.commands.get(commandId);
    if (!command) throw new BadRequestException('Command not found');
    if (!canTransition(command.status, to)) throw new BadRequestException(`Invalid command transition: ${command.status} -> ${to}`);
    command.status = to;
    return command;
  }
}
