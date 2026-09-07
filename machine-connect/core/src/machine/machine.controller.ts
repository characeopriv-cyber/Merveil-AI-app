import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { MachineProvisioningInput } from '../domain/machine';
import { MachineService } from './machine.service';

@Controller('api/machines')
export class MachineController {
  constructor(private readonly machines: MachineService) {}

  @Get()
  list(@Headers('x-tenant-id') tenantId: string) {
    return this.machines.list(this.requireTenant(tenantId));
  }

  @Get(':id')
  get(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.machines.get(this.requireTenant(tenantId), id);
  }

  @Post()
  provision(@Headers('x-tenant-id') tenantId: string, @Body() body: Omit<MachineProvisioningInput, 'tenantId'>) {
    return this.machines.provision({ ...body, tenantId: this.requireTenant(tenantId) });
  }

  @Post(':id/activate')
  activate(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) {
    return this.machines.activate(this.requireTenant(tenantId), id);
  }

  private requireTenant(value?: string): string {
    if (!value?.trim()) throw new Error('Tenant context is required');
    return value.trim();
  }
}
