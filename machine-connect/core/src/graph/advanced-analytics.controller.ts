import { BadRequestException, Controller, Get, Query, Req } from '@nestjs/common';
import { AdvancedAnalyticsService } from './advanced-analytics.service';
import { requirePermission } from '../auth/permissions';

@Controller('/api/graph/advanced')
export class AdvancedAnalyticsController {
  constructor(private readonly analytics: AdvancedAnalyticsService) {}

  @Get('/pagerank')
  async pageRank(@Req() req: any, @Query('iterations') iterations = '20', @Query('damping') damping = '0.85') {
    const principal = requirePermission(req.user, 'graph.analyze');
    return this.analytics.pageRank(principal.tenantId, Number(iterations), Number(damping));
  }

  @Get('/communities')
  async communities(@Req() req: any, @Query('limit') limit = '10000') {
    const principal = requirePermission(req.user, 'graph.analyze');
    return this.analytics.communities(principal.tenantId, Number(limit));
  }

  @Get('/shortest-path')
  async shortestPath(@Req() req: any, @Query('source') source: string, @Query('target') target: string, @Query('maxDepth') maxDepth = '20') {
    const principal = requirePermission(req.user, 'graph.analyze');
    if (!source || !target) throw new BadRequestException('source and target are required');
    return this.analytics.shortestPath(principal.tenantId, source, target, Number(maxDepth));
  }
}
