import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { Principal } from '../auth/principal';
import { requirePermission } from '../auth/permissions';
import { WorkflowTaskStatus } from './workflow.types';

type RequestWithPrincipal = { user?: Principal };

@Controller('api/workflows')
export class WorkflowController {
  constructor(private readonly service: WorkflowService) {}

  @Post()
  create(@Req() req: RequestWithPrincipal, @Body() body: { name: string; steps: { name: string; requiresApproval?: boolean }[] }) {
    const principal = requirePermission(req.user, 'workflow.execute');
    return this.service.createDefinition({ tenantId: principal.tenantId, createdBy: principal.actorId, ...body });
  }

  @Get()
  list(@Req() req: RequestWithPrincipal) {
    return this.service.listDefinitions(requirePermission(req.user, 'workflow.read').tenantId);
  }

  @Post(':workflowId/instances')
  start(@Req() req: RequestWithPrincipal, @Param('workflowId') workflowId: string) {
    const principal = requirePermission(req.user, 'workflow.execute');
    return this.service.start(principal.tenantId, workflowId, principal.actorId);
  }

  @Get('instances')
  instances(@Req() req: RequestWithPrincipal) {
    return this.service.listInstances(requirePermission(req.user, 'workflow.read').tenantId);
  }

  @Get('instances/:instanceId/tasks')
  tasks(@Req() req: RequestWithPrincipal, @Param('instanceId') instanceId: string) {
    return this.service.listTasks(requirePermission(req.user, 'workflow.read').tenantId, instanceId);
  }

  @Post('tasks/:taskId/transition')
  transitionTask(@Req() req: RequestWithPrincipal, @Param('taskId') taskId: string, @Body() body: { status: WorkflowTaskStatus }) {
    const principal = requirePermission(req.user, 'workflow.execute');
    return this.service.transitionTask(principal.tenantId, taskId, principal.actorId, body.status);
  }
}
