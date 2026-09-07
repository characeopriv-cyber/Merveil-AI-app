import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ServiceRequestService } from './service-request.service';

@Controller('api/service-requests')
export class ServiceRequestController {
  constructor(private readonly service: ServiceRequestService) {}

  @Post()
  create(@Headers('x-tenant-id') tenantId: string, @Headers('x-actor-id') requesterId: string, @Body() body: { title: string; category: string; payload?: Record<string, unknown>; idempotencyKey: string; workflowId?: string }) {
    return this.service.create({ tenantId, requesterId, ...body });
  }

  @Get()
  list(@Headers('x-tenant-id') tenantId: string) { return this.service.list(tenantId); }

  @Get(':requestId')
  get(@Headers('x-tenant-id') tenantId: string, @Param('requestId') requestId: string) {
    const request = this.service.get(tenantId, requestId);
    return request ?? { error: 'not_found' };
  }
}
