import { BadRequestException, Controller, Delete, Get, Param, Post, Body, Req } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { requirePermission } from '../auth/permissions';

@Controller('api/security/api-keys')
export class ApiKeyController {
  constructor(private readonly service: ApiKeyService) {}

  @Get()
  list(@Req() req: any) {
    const principal = requirePermission(req.user, 'security.read');
    return this.service.list(principal.tenantId);
  }

  @Post()
  create(@Req() req: any, @Body() body: any) {
    const principal = requirePermission(req.user, 'security.write' as any);
    return this.service.create(principal.tenantId, principal.actorId, String(body?.name ?? ''), body?.expiresAt);
  }

  @Delete(':id')
  revoke(@Req() req: any, @Param('id') id: string) {
    const principal = requirePermission(req.user, 'security.write' as any);
    if (!id) throw new BadRequestException('id is required');
    return this.service.revoke(principal.tenantId, id);
  }
}
