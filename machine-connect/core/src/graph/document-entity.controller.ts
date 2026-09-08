import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { requirePermission } from '../auth/permissions';
import { DocumentEntityService } from './document-entity.service';

@Controller('api/graph/document-entities')
export class DocumentEntityController {
  constructor(private readonly service: DocumentEntityService) {}

  @Get('document/:documentId')
  async byDocument(@Req() req: any, @Param('documentId') documentId: string, @Query('limit') limit?: string) {
    requirePermission(req, 'ontology.read');
    return this.service.listByDocument(req.principal.organizationId, documentId, Number(limit ?? 500));
  }

  @Get('entity/:entityId')
  async byEntity(@Req() req: any, @Param('entityId') entityId: string, @Query('limit') limit?: string) {
    requirePermission(req, 'ontology.read');
    return this.service.listByEntity(req.principal.organizationId, entityId, Number(limit ?? 500));
  }

  @Post()
  async link(@Req() req: any, @Body() body: { documentId: string; entityId: string; confidence?: number; mentionCount?: number }) {
    requirePermission(req, 'ontology.write');
    return this.service.link(req.principal.organizationId, body.documentId, body.entityId, body.confidence, body.mentionCount);
  }
}
