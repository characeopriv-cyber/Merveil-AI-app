import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { RemediationService } from './remediation.service';

@Controller('api/security/remediation')
export class RemediationController {
  constructor(private readonly service: RemediationService) {}

  @Post('jobs') request(@Headers('x-tenant-id') tenantId: string, @Headers('x-actor-id') requestedBy: string, @Body() body: { action: any; targetId: string; reason: string; idempotencyKey: string }) {
    return this.service.request({ tenantId, requestedBy, ...body });
  }
  @Get('jobs') list(@Headers('x-tenant-id') tenantId: string) { return this.service.list(tenantId); }
  @Get('jobs/:id') get(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) { return this.service.get(id, tenantId) ?? { error: 'not_found' }; }
  @Post('jobs/:id/approve') approve(@Headers('x-tenant-id') tenantId: string, @Headers('x-actor-id') approverId: string, @Param('id') id: string) { return this.service.approve(id, tenantId, approverId); }
  @Post('jobs/:id/reject') reject(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string) { return this.service.reject(id, tenantId); }
  @Post('jobs/:id/result') result(@Headers('x-tenant-id') tenantId: string, @Param('id') id: string, @Body() body: { success: boolean; result: Record<string, unknown> }) { return this.service.markResult(id, tenantId, body.result, body.success); }
}
