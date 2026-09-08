import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { EntityService } from './entity.service';
import { RelationshipService } from './relationship.service';
import { requirePermission } from '../auth/permissions';

@Controller('/api/graph')
export class GraphController {
  constructor(private readonly entities: EntityService, private readonly relationships: RelationshipService, private readonly analytics: AnalyticsService) {}

  @Get('entities') search(@Req() req: any, @Query('q') q?: string, @Query('entityTypeId') type?: string, @Query('limit') limit?: string) {
    const principal = requirePermission(req.user, 'ontology.read');
    return this.entities.search(principal.tenantId, q ?? '', type, Number(limit ?? 50));
  }
  @Get('entities/:entityId') get(@Req() req: any, @Param('entityId') id: string) {
    const principal = requirePermission(req.user, 'ontology.read');
    return this.entities.get(principal.tenantId, id);
  }
  @Post('entities') create(@Req() req: any, @Body() body: any) {
    const principal = requirePermission(req.user, 'ontology.write');
    return this.entities.create(principal.tenantId, principal.actorId, body);
  }
  @Get('entities/:entityId/graph') graph(@Req() req: any, @Param('entityId') id: string, @Query('depth') depth?: string) {
    const principal = requirePermission(req.user, 'graph.analyze');
    return this.entities.graph(principal.tenantId, id, Number(depth ?? 2));
  }
  @Get('relationships') list(@Req() req: any, @Query('entityId') id?: string, @Query('limit') limit?: string) {
    const principal = requirePermission(req.user, 'ontology.read');
    return this.relationships.list(principal.tenantId, id, Number(limit ?? 100));
  }
  @Post('relationships') createRelationship(@Req() req: any, @Body() body: any) {
    const principal = requirePermission(req.user, 'ontology.write');
    return this.relationships.create(principal.tenantId, principal.actorId, body);
  }
  @Get('analytics/degree') degree(@Req() req: any) {
    const principal = requirePermission(req.user, 'graph.analyze');
    return this.analytics.degreeCentrality(principal.tenantId);
  }
  @Get('analytics/shortest-path') shortest(@Req() req: any, @Query('source') source?: string, @Query('target') target?: string, @Query('maxDepth') depth?: string) {
    const principal = requirePermission(req.user, 'graph.analyze');
    if (!source || !target) throw new BadRequestException('source and target are required');
    return this.analytics.shortestPath(principal.tenantId, source, target, Number(depth ?? 6));
  }
}
