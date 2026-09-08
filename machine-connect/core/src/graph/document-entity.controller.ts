import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { requirePermission } from '../auth/permissions';
import { DocumentEntityService } from './document-entity.service';

@Controller('api/graph/document-entities')
export class DocumentEntityController {
  constructor(private readonly service: DocumentEntityService) {}

  @Get('document/:documentId')
  async byDocument(@Req() req: any, @Param('documentId') documentId: string, @Query('limit') limit?: string) {
    const principal = requirePermission(req.user, 'ontology.read');
    return this.service.listByDocument(principal.tenantId, documentId, Number(limit ?? 500));
  }

  @Get('entity/:entityId')
  async byEntity(@Req() req: any, @Param('entityId') entityId: string, @Query('limit') limit?: string) {
    const principal = requirePermission(req.user, 'ontology.read');
    return this.service.listByEntity(principal.tenantId, entityId, Number(limit ?? 500));
  }

  @Post()
  async link(@Req() req: any, @Body() body: { documentId: string; entityId: string; confidence?: number; mentionCount?: number }) {
    const principal = requirePermission(req.user, 'ontology.write');
    if (!body?.documentId || !body?.entityId) throw new BadRequestException('documentId and entityId are required');
    return this.service.link(principal.tenantId, body.documentId, body.entityId, body.confidence, body.mentionCount);
  }
}
