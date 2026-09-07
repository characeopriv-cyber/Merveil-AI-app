import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { Principal } from '../auth/principal';
import { requirePermission } from '../auth/permissions';

type RequestWithPrincipal = { user?: Principal };

@Controller('/api/telemetry')
export class TelemetryController {
  constructor(private readonly telemetry: TelemetryService) {}

  @Post(':machineId')
  ingest(@Req() req: RequestWithPrincipal, @Param('machineId') machineId: string, @Body() body: any) {
    const principal = requirePermission(req.user, 'device.control');
    return this.telemetry.append({
      tenantId: principal.tenantId, machineId, source: body.source ?? 'unknown',
      schemaVersion: Number(body.schemaVersion ?? 1), sequence: body.sequence,
      observedAt: body.observedAt ?? new Date().toISOString(),
      quality: body.quality ?? 'unknown', data: body.data ?? {},
    });
  }

  @Get(':machineId')
  list(@Req() req: RequestWithPrincipal, @Param('machineId') machineId: string, @Query('limit') limit?: string) {
    const principal = requirePermission(req.user, 'telemetry.read');
    return this.telemetry.list(principal.tenantId, machineId, Number(limit ?? 100));
  }

  @Post(':machineId/heartbeat')
  heartbeat(@Req() req: RequestWithPrincipal, @Param('machineId') machineId: string) {
    const principal = requirePermission(req.user, 'device.control');
    return this.telemetry.heartbeat(principal.tenantId, machineId);
  }
}
