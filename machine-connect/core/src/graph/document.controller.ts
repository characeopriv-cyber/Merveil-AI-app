import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { DocumentService } from './document.service';
import { requirePermission } from '../auth/permissions';

@Controller('api/graph/documents')
export class DocumentController {
  constructor(private readonly documents: DocumentService) {}

  @Get()
  async list(@Req() req: any, @Query('limit') limit?: string) {
    const principal = requirePermission(req.principal, 'ontology.read');
    return this.documents.list(principal.tenantId, Number(limit ?? 100));
  }

  @Get(':documentId')
  async get(@Req() req: any, @Param('documentId') documentId: string) {
    const principal = requirePermission(req.principal, 'ontology.read');
    return this.documents.get(principal.tenantId, documentId);
  }

  @Post()
  async create(@Req() req: any, @Body() body: { fileName?: string; storagePath?: string; mimeType?: string; byteSize?: number }) {
    const principal = requirePermission(req.principal, 'ontology.write');
    if (principal.actorId.startsWith('machine:')) {
      throw new Error('machine principals cannot create ontology documents');
    }
    return this.documents.create(principal.tenantId, principal.actorId, {
      fileName: body?.fileName ?? '',
      storagePath: body?.storagePath ?? '',
      mimeType: body?.mimeType ?? '',
      byteSize: Number(body?.byteSize ?? 0),
    });
  }
}
