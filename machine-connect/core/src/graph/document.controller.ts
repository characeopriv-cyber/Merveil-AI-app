import { Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { DocumentService } from './document.service';
import { requirePermission } from '../auth/permissions';

@Controller('api/graph/documents')
export class DocumentController {
  constructor(private readonly documents: DocumentService) {}

  @Get()
  async list(@Req() req: any, @Query('limit') limit?: string) {
    requirePermission(req, 'ontology.read');
    return this.documents.list(req.principal.organizationId, Number(limit ?? 100));
  }

  @Get(':documentId')
  async get(@Req() req: any, @Param('documentId') documentId: string) {
    requirePermission(req, 'ontology.read');
    return this.documents.get(req.principal.organizationId, documentId);
  }

  @Post()
  async create(@Req() req: any, @Query('title') title?: string, @Query('storagePath') storagePath?: string, @Query('mimeType') mimeType?: string, @Query('sizeBytes') sizeBytes?: string) {
    requirePermission(req, 'ontology.write');
    return this.documents.create(req.principal.organizationId, req.principal.userId, {
      title: title ?? '', storagePath: storagePath ?? '', mimeType: mimeType ?? '', sizeBytes: Number(sizeBytes ?? 0),
    });
  }
}
