import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { MachineLifecycleState, MachineProvisioningInput } from '../domain/machine';
import { MachineService } from './machine.service';
import { Principal } from '../auth/principal';
import { requirePermission } from '../auth/permissions';

type RequestWithPrincipal = { user?: Principal };

type MachineStateBody = { state: MachineLifecycleState };

@Controller('api/machines')
export class MachineController {
  constructor(private readonly machines: MachineService) {}

  @Get()
  list(@Req() req: RequestWithPrincipal) {
    const principal = requirePermission(req.user, 'device.read');
    return this.machines.list(principal.tenantId);
  }

  @Get(':id')
  get(@Req() req: RequestWithPrincipal, @Param('id') id: string) {
    const principal = requirePermission(req.user, 'device.read');
    return this.machines.get(principal.tenantId, id);
  }

  @Post()
  provision(@Req() req: RequestWithPrincipal, @Body() body: Omit<MachineProvisioningInput, 'tenantId'>) {
    const principal = requirePermission(req.user, 'device.control');
    return this.machines.provision({ ...body, tenantId: principal.tenantId });
  }

  @Post(':id/activate')
  activate(@Req() req: RequestWithPrincipal, @Param('id') id: string) {
    const principal = requirePermission(req.user, 'device.control');
    return this.machines.activate(principal.tenantId, id);
  }

  @Post(':id/state')
  transition(@Req() req: RequestWithPrincipal, @Param('id') id: string, @Body() body: MachineStateBody) {
    const principal = requirePermission(req.user, 'device.control');
    return this.machines.transition(principal.tenantId, id, body.state);
  }
}
