import { Controller, Get, Param, Req } from '@nestjs/common';
import { FleetIntelligenceService } from './fleet-intelligence.service';

@Controller('api/fleet-intelligence')
export class FleetIntelligenceController {
  constructor(private readonly intelligence: FleetIntelligenceService) {}

  @Get('health/:fleetId')
  health(@Req() req: any, @Param('fleetId') fleetId: string) {
    return this.intelligence.fleetHealth(req.principal?.tenantId, fleetId);
  }

  @Get('health/:fleetId/summary')
  async summary(@Req() req: any, @Param('fleetId') fleetId: string) {
    const result = await this.intelligence.fleetHealth(req.principal?.tenantId, fleetId);
    return {
      fleetId: result.fleetId,
      machineCount: result.machineCount,
      onlineCount: result.onlineCount,
      offlineCount: result.offlineCount,
      averageScore: result.averageScore,
      status: result.status,
      generatedAt: result.generatedAt,
    };
  }
}
