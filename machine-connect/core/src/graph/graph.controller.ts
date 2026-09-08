import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { EntityService } from './entity.service';
import { RelationshipService } from './relationship.service';
import { Principal } from '../auth/principal';
import { requirePermission } from '../auth/permissions';

type RequestWithPrincipal = { user?: Principal };

@Controller('/api/graph')
export class GraphController {
  constructor(
    private readonly entities: EntityService,
    private readonly relationships: RelationshipService,
    private readonly analytics: AnalyticsService,
  ) {}

  @Get('entities')
  search(@Req() req: RequestWithPrincipal, @Query('q') q?: string, @Query('entityTypeId') entityTypeId?: string, @Query('limit') limit?: string) {
    const principal = requirePermission(req.user, 'ontology.read');
    return this.entities.search(principal.tenantId, q ?? '', entityTypeId, Number(limit ?? 50));
  }

  @Get('entities/:entityId')
  get(@Req() req: RequestWithPrincipal, @Param('entityId') entityId: string) {
    const principal = requirePermission(req.user, 'ontology.read');
    return this.entities.get(principal.tenantId, entityId);
  }

  @Post('entities')
  create(@Req() req: RequestWithPrincipal, @Body() body: any) {
    const principal = requirePermission(req.user, 'ontology.write');
    return this.entities.create(principal.tenantId, principal.actorId.replace(/^user:/, ''), body);
  }

  @Get('entities/:entityId/graph')
  graph(@Req() req: RequestWithPrincipal, @Param('entityId') entityId: string, @Query('depth') depth?: string) {
    const principal = requirePermission(req.user, 'graph.analyze');
    return this.entities.graph(principal.tenantId, entityId, Number(depth ?? 2));
  }

  @Get('relationships')
  listRelationships(@Req() req: RequestWithPrincipal, @Query('entityId') entityId?: string, @Query('limit') limit?: string) {
    const principal = requirePermission(req.user, 'ontology.read');
    return this.relationships.list(principal.tenantId, entityId, Number(limit ?? 100));
  }

  @Post('relationships')
  createRelationship(@Req() req: RequestWithPrincipal, @Body() body: any) {
    const principal = requirePermission(req.user, 'ontology.write');
    return this.relationships.create(principal.tenantId, principal.actorId.replace(/^user:/, ''), body);
  }

  @Get('analytics/degree')
  degree(@Req() req: RequestWithPrincipal) {
    const principal = requirePermission(req.user, 'graph.analyze');
    return this.analytics.degreeCentrality(principal.tenantId);
  }

  @Get('analytics/shortest-path')
  shortestPath(@Req() req: RequestWithPrincipal, @Query('source') source: string, @Query('target') target: string, @Query('maxDepth') maxDepth?: string) {
    const principal = requirePermission(req.user, 'graph.analyze');
    return this.analytics.shortestPath(principal.tenantId, source, target, Number(maxDepth ?? 6));
  }
}
