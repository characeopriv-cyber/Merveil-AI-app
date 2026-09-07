import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { WorkflowService } from './workflow.service';

@Controller('api/workflows')
export class WorkflowController {
  constructor(private readonly service: WorkflowService) {}

  @Post()
  create(@Headers('x-tenant-id') tenantId: string, @Headers('x-actor-id') createdBy: string, @Body() body: { name: string; steps: { name: string; requiresApproval?: boolean }[] }) {
    return this.service.createDefinition({ tenantId, createdBy, ...body });
  }

  @Get()
  list(@Headers('x-tenant-id') tenantId: string) { return this.service.listDefinitions(tenantId); }

  @Post(':workflowId/instances')
  start(@Headers('x-tenant-id') tenantId: string, @Headers('x-actor-id') requestedBy: string, @Param('workflowId') workflowId: string) {
    return this.service.start(tenantId, workflowId, requestedBy);
  }

  @Get('instances')
  instances(@Headers('x-tenant-id') tenantId: string) { return this.service.listInstances(tenantId); }

  @Get('instances/:instanceId/tasks')
  tasks(@Headers('x-tenant-id') tenantId: string, @Param('instanceId') instanceId: string) {
    return this.service.listTasks(tenantId, instanceId);
  }
}
