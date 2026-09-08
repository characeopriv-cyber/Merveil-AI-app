import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { EntityService } from './entity.service';
import { RelationshipService } from './relationship.service';
import { requirePermission } from '../auth/permissions';

@Controller('/api/graph')
export class GraphController { constructor(private readonly entities:EntityService,private readonly relationships:RelationshipService,private readonly analytics:AnalyticsService){}
 @Get('entities') search(@Req() req:any,@Query('q') q?:string,@Query('entityTypeId') type?:string,@Query('limit') limit?:string){requirePermission(req,'ontology.read');return this.entities.search(req.principal.tenantId,q??'',type,Number(limit??50));}
 @Get('entities/:entityId') get(@Req() req:any,@Param('entityId') id:string){requirePermission(req,'ontology.read');return this.entities.get(req.principal.tenantId,id);}
 @Post('entities') create(@Req() req:any,@Body() body:any){requirePermission(req,'ontology.write');return this.entities.create(req.principal.tenantId,req.principal.actorId,body);}
 @Get('entities/:entityId/graph') graph(@Req() req:any,@Param('entityId') id:string,@Query('depth') depth?:string){requirePermission(req,'graph.analyze');return this.entities.graph(req.principal.tenantId,id,Number(depth??2));}
 @Get('relationships') list(@Req() req:any,@Query('entityId') id?:string,@Query('limit') limit?:string){requirePermission(req,'ontology.read');return this.relationships.list(req.principal.tenantId,id,Number(limit??100));}
 @Post('relationships') createRelationship(@Req() req:any,@Body() body:any){requirePermission(req,'ontology.write');return this.relationships.create(req.principal.tenantId,req.principal.actorId,body);}
 @Get('analytics/degree') degree(@Req() req:any){requirePermission(req,'graph.analyze');return this.analytics.degreeCentrality(req.principal.tenantId);}
 @Get('analytics/shortest-path') shortest(@Req() req:any,@Query('source') source:string,@Query('target') target:string,@Query('maxDepth') depth?:string){requirePermission(req,'graph.analyze');if(!source||!target)throw new Error('source and target are required');return this.analytics.shortestPath(req.principal.tenantId,source,target,Number(depth??6));}
}
