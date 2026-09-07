import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ServiceRequestService } from './service-request.service';
import { Principal } from '../auth/principal';
import { requirePermission } from '../auth/permissions';

type RequestWithPrincipal = { user?: Principal };

@Controller('api/service-requests')
export class ServiceRequestController {
  constructor(private readonly service: ServiceRequestService) {}

  @Post()
  create(@Req() req: RequestWithPrincipal, @Body() body: { title: string; category: string; payload?: Record<string, unknown>; idempotencyKey: string; workflowId?: string }) {
    const principal = requirePermission(req.user, 'workflow.execute');
    return this.service.create({ tenantId: principal.tenantId, requesterId: principal.actorId, ...body });
  }

  @Get()
  list(@Req() req: RequestWithPrincipal) {
    return this.service.list(requirePermission(req.user, 'workflow.read').tenantId);
  }

  @Get(':requestId')
  get(@Req() req: RequestWithPrincipal, @Param('requestId') requestId: string) {
    const request = this.service.get(requirePermission(req.user, 'workflow.read').tenantId, requestId);
    return request ?? { error: 'not_found' };
  }
}
