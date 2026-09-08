import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { requirePermission } from '../auth/permissions';
import { IntelligenceJobService } from './intelligence-job.service';

@Controller('api/intelligence/jobs')
export class IntelligenceJobController {
  constructor(private readonly jobs:IntelligenceJobService) {}
  @Get()
  list(@Req() req:any){const p=requirePermission(req.principal,'graph.analyze');return this.jobs.list(p.tenantId);}
  @Get(':id')
  get(@Req() req:any,@Param('id') id:string){const p=requirePermission(req.principal,'graph.analyze');return this.jobs.get(p.tenantId,id);}
  @Post()
  enqueue(@Req() req:any,@Body() body:any){const p=requirePermission(req.principal,'graph.analyze');if(!UUID.test(p.actorId)) throw new Error('Job creation requires a user session');return this.jobs.enqueue(p.tenantId,p.actorId,body??{});}
}
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
