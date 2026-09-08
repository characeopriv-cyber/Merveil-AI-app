import { Controller, Get, Post, Req, Body, Query, BadRequestException } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { EvidenceIntegrityService } from './evidence-integrity.service';
import { requirePermission } from '../auth/permissions';

@Controller('api/compliance')
export class ComplianceController {
  constructor(private readonly service: ComplianceService, private readonly integrity: EvidenceIntegrityService) {}

  @Get('frameworks') frameworks(@Req() req: any) { requirePermission(req.user, 'ontology.read'); return this.service.frameworks(); }
  @Get('controls') controls(@Req() req: any, @Query('frameworkId') frameworkId?: string) { requirePermission(req.user, 'ontology.read'); return this.service.controls(frameworkId); }
  @Get('statuses') statuses(@Req() req: any) { requirePermission(req.user, 'ontology.read'); return this.service.statuses(req.user.tenantId); }
  @Post('statuses') upsertStatus(@Req() req: any, @Body() body: any) {
    requirePermission(req.user, 'ontology.write');
    const controlId = String(body?.controlId ?? '');
    if (!controlId) throw new BadRequestException('controlId is required');
    return this.service.upsertStatus(req.user.tenantId, controlId, body, req.user.actorId);
  }
  @Get('evidence') evidence(@Req() req: any) { requirePermission(req.user, 'ontology.read'); return this.service.evidence(req.user.tenantId); }

  @Post('evidence/:evidenceId/integrity') recordIntegrity(@Req() req: any, @Query('evidenceId') queryEvidenceId: string | undefined, @Body() body: any) {
    requirePermission(req.user, 'security.write');
    const evidenceId = String(body?.evidenceId ?? queryEvidenceId ?? '');
    if (!evidenceId) throw new BadRequestException('evidenceId is required');
    return this.integrity.record(req.user.tenantId, evidenceId);
  }

  @Get('evidence/:evidenceId/verify') verifyIntegrity(@Req() req: any, @Query('evidenceId') queryEvidenceId: string | undefined, @Body() body: any) {
    requirePermission(req.user, 'security.read');
    const evidenceId = String(body?.evidenceId ?? queryEvidenceId ?? '');
    if (!evidenceId) throw new BadRequestException('evidenceId is required');
    return this.integrity.verify(req.user.tenantId, evidenceId);
  }
}
