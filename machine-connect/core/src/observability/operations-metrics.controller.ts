import { Controller, Get, Headers, Param, UnauthorizedException } from '@nestjs/common';
import { OperationsMetricsService } from './operations-metrics.service';

@Controller('api/observability')
export class OperationsMetricsController {
  constructor(private readonly metrics: OperationsMetricsService) {}

  @Get('fleets/:fleetId')
  async fleet(@Headers('x-organization-id') organizationId: string | undefined, @Param('fleetId') fleetId: string) {
    if (!organizationId) throw new UnauthorizedException('Missing organization context');
    return this.metrics.fleet(organizationId, fleetId);
  }
}
