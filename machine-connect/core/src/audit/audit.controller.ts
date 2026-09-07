import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AuditService } from './audit.service';
import { randomUUID } from 'node:crypto';
import { Principal, requirePrincipal } from '../auth/principal';

type RequestWithPrincipal = { user?: Principal };

@Controller('/api/audit')
export class AuditController {
  constructor(private readonly audit: AuditService) {}
  @Post() append(@Req() req: RequestWithPrincipal, @Body() body: any) {
    const principal = requirePrincipal(req.user);
    return this.audit.append({ id: randomUUID(), tenantId: principal.tenantId, actorId: principal.actorId, action: body.action ?? 'unknown', resourceType: body.resourceType ?? 'unknown', resourceId: body.resourceId ?? '', outcome: body.outcome ?? 'failed', timestamp: new Date().toISOString(), metadata: body.metadata });
  }
  @Get() list(@Req() req: RequestWithPrincipal) { return this.audit.list(requirePrincipal(req.user).tenantId); }
}
