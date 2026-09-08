import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { RemediationService } from './remediation.service';
import { RolloutService } from './rollout.service';
import { SupabaseRest } from '../persistence/supabase-rest';

@Controller('api/fleet-operations')
export class FleetOperationsController {
  constructor(private readonly remediation: RemediationService, private readonly rollouts: RolloutService, private readonly db: SupabaseRest) {}
  private tenant(req: any) { const id = req.principal?.tenantId ?? req.user?.tenantId; if (!id) throw new BadRequestException('Authenticated tenant context is required'); return id; }
  private actor(req: any) { const id = req.principal?.actorId ?? req.user?.actorId; if (!id) throw new BadRequestException('Authenticated actor context is required'); return id; }

  @Post('remediation/evaluate/:fleetId')
  evaluate(@Req() req: any, @Param('fleetId') fleetId: string) { return this.remediation.evaluate(this.tenant(req), fleetId, this.actor(req)); }

  @Post('rollouts')
  rollout(@Req() req: any, @Body() body: any) { return this.rollouts.create({ tenantId: this.tenant(req), actorId: this.actor(req), fleetId: body.fleetId, capability: body.capability, parameters: body.parameters ?? {}, safetyClass: body.safetyClass, stageSize: body.stageSize, maxConcurrency: body.maxConcurrency, idempotencyKey: body.idempotencyKey }); }

  @Get('rollouts')
  listRollouts(@Req() req: any) { return this.rollouts.list(this.tenant(req), typeof req.query?.fleetId === 'string' ? req.query.fleetId : undefined); }

  @Get('rollouts/:rolloutId')
  rolloutStatus(@Req() req: any, @Param('rolloutId') id: string) { return this.rollouts.get(this.tenant(req), id); }

  @Post('rollouts/:rolloutId/run')
  run(@Req() req: any, @Param('rolloutId') id: string) { this.actor(req); return this.rollouts.run(this.tenant(req), id); }

  @Patch('rollouts/:rolloutId/pause')
  pause(@Req() req: any, @Param('rolloutId') id: string) { this.actor(req); return this.rollouts.pause(this.tenant(req), id); }

  @Patch('rollouts/:rolloutId/cancel')
  cancel(@Req() req: any, @Param('rolloutId') id: string) { this.actor(req); return this.rollouts.cancel(this.tenant(req), id); }

  @Get('audit/:fleetId')
  audit(@Req() req: any, @Param('fleetId') fleetId: string) {
    const tenant = this.tenant(req);
    if (!this.db.enabled) return [];
    const limit = Math.min(Math.max(Number(req.query?.limit) || 100, 1), 500);
    return this.db.request<any[]>(`machine_connect_operational_audit?organization_id=eq.${encodeURIComponent(tenant)}&fleet_id=eq.${encodeURIComponent(fleetId)}&order=created_at.desc&limit=${limit}`);
  }
}
