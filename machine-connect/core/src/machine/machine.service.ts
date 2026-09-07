import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Machine, MachineProvisioningInput } from '../domain/machine';

@Injectable()
export class MachineService {
  private readonly machines = new Map<string, Machine>();

  provision(input: MachineProvisioningInput): Machine {
    const now = new Date().toISOString();
    const machine: Machine = {
      id: randomUUID(),
      tenantId: input.tenantId,
      name: input.name,
      type: input.type,
      manufacturer: input.manufacturer,
      model: input.model,
      firmwareVersion: input.firmwareVersion,
      lifecycleState: 'provisioning',
      connectionState: 'unknown',
      adapterId: input.adapterId,
      capabilities: [...new Set(input.capabilities ?? [])],
      createdAt: now,
      updatedAt: now,
    };
    this.machines.set(machine.id, machine);
    return machine;
  }

  list(tenantId: string): Machine[] {
    return [...this.machines.values()].filter((machine) => machine.tenantId === tenantId);
  }

  get(tenantId: string, id: string): Machine {
    const machine = this.machines.get(id);
    if (!machine || machine.tenantId !== tenantId) throw new NotFoundException('Machine not found');
    return machine;
  }

  activate(tenantId: string, id: string): Machine {
    const machine = this.get(tenantId, id);
    machine.lifecycleState = 'active';
    machine.updatedAt = new Date().toISOString();
    return machine;
  }
}
