import { Controller, Headers, Param, Post, Body } from '@nestjs/common';
import { EmergencyStopService } from './emergency-stop.service';

@Controller('/api/machines')
export class EmergencyStopController {
  constructor(private readonly service: EmergencyStopService) {}
  @Post(':machineId/emergency-stop')
  stop(@Param('machineId') machineId: string, @Headers('x-tenant-id') tenantId: string, @Headers('x-actor-id') actorId: string, @Body() body: any) {
    if (!tenantId || !actorId) throw new Error('Authenticated tenant and actor context required');
    return this.service.stop(tenantId, actorId, machineId, body?.reason ?? 'Emergency stop requested');
  }
  @Post(':machineId/emergency-stop/reset')
  reset(@Param('machineId') machineId: string, @Headers('x-tenant-id') tenantId: string, @Headers('x-actor-id') actorId: string) {
    if (!tenantId || !actorId) throw new Error('Authenticated tenant and actor context required');
    return this.service.reset(tenantId, actorId, machineId);
  }
}
