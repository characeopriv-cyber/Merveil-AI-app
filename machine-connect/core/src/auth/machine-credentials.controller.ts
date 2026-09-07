import { Controller, Param, Post, Req } from '@nestjs/common';
import { MachineCredentialsService } from './machine-credentials.service';
import { Principal } from './principal';
import { requirePermission } from './permissions';

type RequestWithPrincipal = { user?: Principal };

@Controller('api/machine-auth')
export class MachineCredentialsController {
  constructor(private readonly credentials: MachineCredentialsService) {}

  @Post(':machineId/credentials')
  issue(@Req() req: RequestWithPrincipal, @Param('machineId') machineId: string) {
    const principal = requirePermission(req.user, 'device.control');
    return this.credentials.issue(principal.tenantId, machineId);
  }

  @Post(':machineId/credentials/rotate')
  rotate(@Req() req: RequestWithPrincipal, @Param('machineId') machineId: string) {
    const principal = requirePermission(req.user, 'device.control');
    return this.credentials.rotate(principal.tenantId, machineId);
  }

  @Post(':machineId/credentials/revoke')
  revoke(@Req() req: RequestWithPrincipal, @Param('machineId') machineId: string) {
    const principal = requirePermission(req.user, 'device.control');
    return this.credentials.revoke(principal.tenantId, machineId);
  }
}
