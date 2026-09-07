import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { Principal, requirePrincipal } from '../auth/principal';

type RequestWithPrincipal = { user?: Principal };

@Controller('api/workflows')
export class WorkflowController {
  constructor(private readonly service: WorkflowService) {}

  @Post()
  create(@Req() req: RequestWithPrincipal, @Body() body: { name: string; steps: { name: string; requiresApproval?: boolean }[] }) {
    const principal = requirePrincipal(req.user);
    return this.service.createDefinition({ tenantId: principal.tenantId, createdBy: principal.actorId, ...body });
  }

  @Get()
  list(@Req() req: RequestWithPrincipal) { return this.service.listDefinitions(requirePrincipal(req.user).tenantId); }

  @Post(':workflowId/instances')
  start(@Req() req: RequestWithPrincipal, @Param('workflowId') workflowId: string) {
    const principal = requirePrincipal(req.user);
    return this.service.start(principal.tenantId, workflowId, principal.actorId);
  }

  @Get('instances')
  instances(@Req() req: RequestWithPrincipal) { return this.service.listInstances(requirePrincipal(req.user).tenantId); }

  @Get('instances/:instanceId/tasks')
  tasks(@Req() req: RequestWithPrincipal, @Param('instanceId') instanceId: string) {
    return this.service.listTasks(requirePrincipal(req.user).tenantId, instanceId);
  }
}
