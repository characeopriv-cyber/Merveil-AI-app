import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { MachineProvisioningInput } from '../domain/machine';
import { MachineService } from './machine.service';
import { Principal, requirePrincipal, requireRole } from '../auth/principal';

type RequestWithPrincipal = { user?: Principal };

@Controller('api/machines')
export class MachineController {
  constructor(private readonly machines: MachineService) {}

  @Get()
  list(@Req() req: RequestWithPrincipal) {
    return this.machines.list(requirePrincipal(req.user).tenantId);
  }

  @Get(':id')
  get(@Req() req: RequestWithPrincipal, @Param('id') id: string) {
    return this.machines.get(requirePrincipal(req.user).tenantId, id);
  }

  @Post()
  provision(@Req() req: RequestWithPrincipal, @Body() body: Omit<MachineProvisioningInput, 'tenantId'>) {
    const principal = requireRole(req.user, 'owner', 'admin', 'operator');
    return this.machines.provision({ ...body, tenantId: principal.tenantId });
  }

  @Post(':id/activate')
  activate(@Req() req: RequestWithPrincipal, @Param('id') id: string) {
    const principal = requireRole(req.user, 'owner', 'admin', 'operator');
    return this.machines.activate(principal.tenantId, id);
  }
}
