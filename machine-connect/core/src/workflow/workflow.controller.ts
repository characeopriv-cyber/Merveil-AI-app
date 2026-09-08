import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { ExecutionWorkerService } from './execution-worker.service';
import { Principal } from '../auth/principal';
import { requirePermission } from '../auth/permissions';
import { WorkflowTaskStatus } from './workflow.types';

type RequestWithPrincipal={user?:Principal};
@Controller('api/workflows')
export class WorkflowController { constructor(private readonly service:WorkflowService, private readonly worker:ExecutionWorkerService){}
 @Post() create(@Req() req:RequestWithPrincipal,@Body() body:{name:string;steps:{name:string;requiresApproval?:boolean}[]}){const p=requirePermission(req.user,'workflow.execute');return this.service.createDefinition({tenantId:p.tenantId,createdBy:p.actorId,...body});}
 @Get() list(@Req() req:RequestWithPrincipal){return this.service.listDefinitions(requirePermission(req.user,'workflow.read').tenantId);}
 @Post(':workflowId/instances') start(@Req() req:RequestWithPrincipal,@Param('workflowId') id:string){const p=requirePermission(req.user,'workflow.execute');return this.service.start(p.tenantId,id,p.actorId);}
 @Get('instances') instances(@Req() req:RequestWithPrincipal){return this.service.listInstances(requirePermission(req.user,'workflow.read').tenantId);}
 @Get('instances/:instanceId/tasks') tasks(@Req() req:RequestWithPrincipal,@Param('instanceId') id:string){return this.service.listTasks(requirePermission(req.user,'workflow.read').tenantId,id);}
 @Post('tasks/:taskId/transition') transition(@Req() req:RequestWithPrincipal,@Param('taskId') id:string,@Body() body:{status:WorkflowTaskStatus}){const p=requirePermission(req.user,'workflow.execute');return this.service.transitionTask(p.tenantId,id,p.actorId,body.status);}
 @Post('executions') enqueue(@Req() req:RequestWithPrincipal,@Body() body:any){const p=requirePermission(req.user,'workflow.execute');if(!body.rule||!body.event) throw new Error('rule and event required');return this.service.enqueueExecution({tenantId:p.tenantId,rule:body.rule,event:body.event,maxAttempts:body.maxAttempts});}
 @Get('executions') executions(@Req() req:RequestWithPrincipal){return this.service.listExecutions(requirePermission(req.user,'workflow.read').tenantId);}
 @Get('executions/worker-health') workerHealth(@Req() req:RequestWithPrincipal){requirePermission(req.user,'workflow.read');return this.worker.health();}
 @Post('executions/worker-tick') workerTick(@Req() req:RequestWithPrincipal){requirePermission(req.user,'workflow.execute');return this.worker.tick();}
 @Post('executions/:executionId/run') run(@Req() req:RequestWithPrincipal,@Param('executionId') id:string){const p=requirePermission(req.user,'workflow.execute');return this.service.runExecution(p.tenantId,id);}
 @Post('executions/:executionId/cancel') cancel(@Req() req:RequestWithPrincipal,@Param('executionId') id:string){const p=requirePermission(req.user,'workflow.execute');return this.service.cancelExecution(p.tenantId,id);}
}
