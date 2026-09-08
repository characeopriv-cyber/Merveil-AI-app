import { BadRequestException, Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { FleetIntelligenceService } from './fleet-intelligence.service';

@Controller('api/fleet-intelligence')
export class FleetIntelligenceController {
  constructor(private readonly intelligence: FleetIntelligenceService) {}

  @Get('health/:fleetId')
  health(@Req() req: any, @Param('fleetId') fleetId: string) { return this.intelligence.health(this.tenant(req), fleetId); }
  @Get('summary/:fleetId')
  summary(@Req() req: any, @Param('fleetId') fleetId: string) { return this.intelligence.summary(this.tenant(req), fleetId); }
  @Get('risk/:fleetId')
  risk(@Req() req: any, @Param('fleetId') fleetId: string) { return this.intelligence.risk(this.tenant(req), fleetId); }
  @Get('history/:fleetId')
  history(@Req() req: any, @Param('fleetId') fleetId: string) { return this.intelligence.history(this.tenant(req), fleetId, Math.min(Math.max(Number(req.query?.limit) || 100, 1), 500)); }

  @Patch('alerts/:alertId/acknowledge')
  acknowledge(@Req() req: any, @Param('alertId') alertId: string) {
    const tenant = this.tenant(req);
    const actorId = req.principal?.actorId ?? req.user?.actorId;
    if (!actorId) throw new BadRequestException('Authenticated actor context is required');
    return this.intelligence.acknowledgeAlert(tenant, alertId, actorId);
  }

  private tenant(req: any): string {
    const tenantId = req.principal?.tenantId ?? req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Authenticated tenant context is required');
    return tenantId;
  }
}
