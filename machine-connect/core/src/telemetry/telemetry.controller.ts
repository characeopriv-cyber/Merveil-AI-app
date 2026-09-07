import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';
import { Principal, requirePrincipal } from '../auth/principal';

type RequestWithPrincipal = { user?: Principal };

@Controller('/api/telemetry')
export class TelemetryController {
  constructor(private readonly telemetry: TelemetryService) {}

  @Post(':machineId')
  ingest(@Req() req: RequestWithPrincipal, @Param('machineId') machineId: string, @Body() body: any) {
    return this.telemetry.append({
      tenantId: requirePrincipal(req.user).tenantId, machineId, source: body.source ?? 'unknown',
      schemaVersion: Number(body.schemaVersion ?? 1), sequence: body.sequence,
      observedAt: body.observedAt ?? new Date().toISOString(),
      quality: body.quality ?? 'unknown', data: body.data ?? {},
    });
  }

  @Get(':machineId')
  list(@Req() req: RequestWithPrincipal, @Param('machineId') machineId: string, @Query('limit') limit?: string) {
    return this.telemetry.list(requirePrincipal(req.user).tenantId, machineId, Number(limit ?? 100));
  }
}
