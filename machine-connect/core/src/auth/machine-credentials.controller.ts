import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { MachineCredentialsService } from './machine-credentials.service';
import { RequestWithPrincipal } from '../machine/machine.controller';
import { requirePermission } from './permissions';

@Controller('api/machine-auth')
export class MachineCredentialsController {
  constructor(private readonly credentials: MachineCredentialsService) {}

  @Post(':machineId/credentials')
  async issue(@Req() req: RequestWithPrincipal, @Param('machineId') machineId: string, @Body() body: { tenantId?: string }) {
    const principal = requirePermission(req.user, 'device.control');
    if (body.tenantId && body.tenantId !== principal.tenantId) throw new Error('Tenant mismatch');
    return this.credentials.issue(principal.tenantId, machineId);
  }
}
