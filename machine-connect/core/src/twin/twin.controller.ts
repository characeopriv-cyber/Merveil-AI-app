import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { requirePermission } from '../auth/permissions';
import { Principal } from '../auth/principal';
import { TwinService } from './twin.service';

type RequestWithPrincipal = { user?: Principal };

@Controller('/api/twins')
export class TwinController {
  constructor(private readonly twins: TwinService) {}

  @Get(':machineId')
  get(@Req() req: RequestWithPrincipal, @Param('machineId') machineId: string) {
    const principal = requirePermission(req.user, 'telemetry.read');
    return this.twins.get(principal.tenantId, machineId);
  }

  @Get(':machineId/history')
  history(@Req() req: RequestWithPrincipal, @Param('machineId') machineId: string, @Query('limit') limit?: string) {
    const principal = requirePermission(req.user, 'telemetry.read');
    return this.twins.history(principal.tenantId, machineId, Number(limit ?? 50));
  }

  @Post(':machineId/reconcile')
  reconcile(@Req() req: RequestWithPrincipal, @Param('machineId') machineId: string, @Body() body: any) {
    const principal = requirePermission(req.user, 'device.control');
    return this.twins.reconcile({
      tenantId: principal.tenantId,
      machineId,
      reportedState: body?.reportedState ?? {},
      observedAt: body?.observedAt,
      source: body?.source,
      expectedVersion: body?.expectedVersion == null ? undefined : Number(body.expectedVersion),
    });
  }
}
