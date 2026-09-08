import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { FleetService } from './fleet.service';

@Controller('api/fleets')
export class FleetController {
  constructor(private readonly fleets: FleetService) {}
  private tenant(req: any): string { return req.user?.tenantId; }
  private actor(req: any): string { return req.user?.actorId; }

  @Post()
  create(@Req() req: any, @Body() body: { name: string; description?: string }) {
    return this.fleets.create(this.tenant(req), body.name, body.description, this.actor(req));
  }

  @Get()
  list(@Req() req: any) { return this.fleets.list(this.tenant(req)); }

  @Post(':fleetId/machines')
  addMachines(@Req() req: any, @Param('fleetId') fleetId: string, @Body() body: { machineIds: string[] }) {
    return this.fleets.addMachines(this.tenant(req), fleetId, body.machineIds ?? []);
  }

  @Get(':fleetId/machines')
  members(@Req() req: any, @Param('fleetId') fleetId: string) {
    return this.fleets.members(this.tenant(req), fleetId);
  }

  @Post(':fleetId/commands')
  bulkCommand(@Req() req: any, @Param('fleetId') fleetId: string, @Body() body: { capability: string; parameters?: Record<string, unknown>; safetyClass?: 'read'|'control'|'critical'; maxParallel?: number }) {
    return this.fleets.bulkCommand({ tenantId: this.tenant(req), requestedBy: this.actor(req), fleetId, capability: body.capability, parameters: body.parameters ?? {}, safetyClass: body.safetyClass, maxParallel: body.maxParallel });
  }
}
