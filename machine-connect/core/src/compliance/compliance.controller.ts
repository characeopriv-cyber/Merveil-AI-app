import { Controller, Get, Post, Req, Body, Query, BadRequestException } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { requirePermission } from '../auth/permissions';

@Controller('api/compliance')
export class ComplianceController {
  constructor(private readonly service: ComplianceService) {}

  @Get('frameworks') frameworks(@Req() req: any) {
    requirePermission(req.user, 'ontology.read');
    return this.service.frameworks();
  }

  @Get('controls') controls(@Req() req: any, @Query('frameworkId') frameworkId?: string) {
    requirePermission(req.user, 'ontology.read');
    return this.service.controls(frameworkId);
  }

  @Get('statuses') statuses(@Req() req: any) {
    requirePermission(req.user, 'ontology.read');
    return this.service.statuses(req.user.tenantId);
  }

  @Post('statuses') upsertStatus(@Req() req: any, @Body() body: any) {
    requirePermission(req.user, 'ontology.write');
    const controlId = String(body?.controlId ?? '');
    if (!controlId) throw new BadRequestException('controlId is required');
    return this.service.upsertStatus(req.user.tenantId, controlId, body, req.user.actorId);
  }

  @Get('evidence') evidence(@Req() req: any) {
    requirePermission(req.user, 'ontology.read');
    return this.service.evidence(req.user.tenantId);
  }
}
