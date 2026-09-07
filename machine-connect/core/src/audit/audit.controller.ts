import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { AuditService } from './audit.service';
import { randomUUID } from 'node:crypto';

@Controller('/api/audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}
  @Post() append(@Headers('x-tenant-id') tenantId: string, @Headers('x-actor-id') actorId: string, @Body() body: any) {
    return this.audit.append({ id: randomUUID(), tenantId: tenantId ?? '', actorId: actorId ?? '', action: body.action ?? 'unknown', resourceType: body.resourceType ?? 'unknown', resourceId: body.resourceId ?? '', outcome: body.outcome ?? 'failed', timestamp: new Date().toISOString(), metadata: body.metadata });
  }
  @Get() list(@Headers('x-tenant-id') tenantId: string) { return this.audit.list(tenantId ?? ''); }
}
