import { Controller, Param, Post, Body, Req } from '@nestjs/common';
import { EmergencyStopService } from './emergency-stop.service';
import { Principal, requirePrincipal, requireRole } from '../auth/principal';

type RequestWithPrincipal = { user?: Principal };

@Controller('/api/machines')
export class EmergencyStopController {
  constructor(private readonly service: EmergencyStopService) {}
  @Post(':machineId/emergency-stop')
  stop(@Req() req: RequestWithPrincipal, @Param('machineId') machineId: string, @Body() body: any) {
    const principal = requireRole(req.user, 'owner', 'admin', 'operator');
    return this.service.stop(principal.tenantId, principal.actorId, machineId, body?.reason ?? 'Emergency stop requested');
  }
  @Post(':machineId/emergency-stop/reset')
  reset(@Req() req: RequestWithPrincipal, @Param('machineId') machineId: string) {
    const principal = requireRole(req.user, 'owner', 'admin', 'operator');
    return this.service.reset(principal.tenantId, principal.actorId, machineId);
  }
}
