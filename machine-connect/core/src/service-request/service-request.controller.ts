import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ServiceRequestService } from './service-request.service';
import { Principal, requirePrincipal } from '../auth/principal';

type RequestWithPrincipal = { user?: Principal };

@Controller('api/service-requests')
export class ServiceRequestController {
  constructor(private readonly service: ServiceRequestService) {}

  @Post()
  create(@Req() req: RequestWithPrincipal, @Body() body: { title: string; category: string; payload?: Record<string, unknown>; idempotencyKey: string; workflowId?: string }) {
    const principal = requirePrincipal(req.user);
    return this.service.create({ tenantId: principal.tenantId, requesterId: principal.actorId, ...body });
  }

  @Get()
  list(@Req() req: RequestWithPrincipal) { return this.service.list(requirePrincipal(req.user).tenantId); }

  @Get(':requestId')
  get(@Req() req: RequestWithPrincipal, @Param('requestId') requestId: string) {
    const request = this.service.get(requirePrincipal(req.user).tenantId, requestId);
    return request ?? { error: 'not_found' };
  }
}
