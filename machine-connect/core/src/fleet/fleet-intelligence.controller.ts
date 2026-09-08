import { BadRequestException, Body, Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { FleetIntelligenceService } from './fleet-intelligence.service';

@Controller('api/fleet-intelligence')
export class FleetIntelligenceController {
  constructor(private readonly intelligence: FleetIntelligenceService) {}

  @Get('health/:fleetId')
  health(@Req() req: any, @Param('fleetId') fleetId: string) {
    return this.intelligence.health(this.tenant(req), fleetId);
  }

  @Get('summary/:fleetId')
  summary(@Req() req: any, @Param('fleetId') fleetId: string) {
    return this.intelligence.summary(this.tenant(req), fleetId);
  }

  @Get('history/:fleetId')
  history(@Req() req: any, @Param('fleetId') fleetId: string) {
    return this.intelligence.history(this.tenant(req), fleetId, Number(req.query?.limit ?? 100));
  }

  @Patch('alerts/:alertId/acknowledge')
  acknowledge(@Req() req: any, @Param('alertId') alertId: string, @Body() body: any) {
    return this.intelligence.acknowledgeAlert(this.tenant(req), alertId, req.principal?.actorId ?? body?.actorId ?? 'system');
  }

  private tenant(req: any): string {
    const tenantId = req.principal?.tenantId ?? req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Authenticated tenant context is required');
    return tenantId;
  }
}
