import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { TelemetryService } from './telemetry.service';

@Controller('/api/telemetry')
export class TelemetryController {
  constructor(private readonly telemetry: TelemetryService) {}

  @Post(':machineId')
  ingest(@Param('machineId') machineId: string, @Headers('x-tenant-id') tenantId: string, @Body() body: any) {
    return this.telemetry.append({
      tenantId: tenantId ?? '', machineId, source: body.source ?? 'unknown',
      schemaVersion: Number(body.schemaVersion ?? 1), sequence: body.sequence,
      observedAt: body.observedAt ?? new Date().toISOString(),
      quality: body.quality ?? 'unknown', data: body.data ?? {},
    });
  }

  @Get(':machineId')
  list(@Param('machineId') machineId: string, @Headers('x-tenant-id') tenantId: string, @Query('limit') limit?: string) {
    return this.telemetry.list(tenantId ?? '', machineId, Number(limit ?? 100));
  }
}
