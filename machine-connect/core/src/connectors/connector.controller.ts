import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { requirePermission } from '../auth/permissions';
import { ConnectorService } from './connector.service';
import { ConnectorRegistry } from './connector.registry';

@Controller('api/connectors')
export class ConnectorController {
  constructor(private readonly connectors: ConnectorService, private readonly registry: ConnectorRegistry) {}

  @Get('providers')
  providers(@Req() req: any) {
    requirePermission(req.principal, 'security.read');
    return this.registry.list();
  }

  @Get()
  async list(@Req() req: any) {
    const principal = requirePermission(req.principal, 'security.read');
    return this.connectors.list(principal.tenantId);
  }

  @Get(':id')
  async get(@Req() req: any, @Param('id') id: string) {
    const principal = requirePermission(req.principal, 'security.read');
    return this.connectors.get(principal.tenantId, id);
  }

  @Post()
  async create(@Req() req: any, @Body() body: any) {
    const principal = requirePermission(req.principal, 'security.write');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(principal.actorId)) throw new Error('Connector creation requires a user session');
    return this.connectors.create(principal.tenantId, principal.actorId, body ?? {});
  }

  @Post(':id/health-check')
  async healthCheck(@Req() req: any, @Param('id') id: string) {
    const principal = requirePermission(req.principal, 'security.read');
    return this.connectors.healthCheck(principal.tenantId, principal.actorId, id);
  }

  @Patch(':id/status')
  async status(@Req() req: any, @Param('id') id: string, @Body() body: { status?: any; error?: string }) {
    const principal = requirePermission(req.principal, 'security.write');
    if (!['disabled', 'pending', 'active', 'error', 'revoked'].includes(body?.status)) throw new Error('Invalid connector status');
    return this.connectors.setStatus(principal.tenantId, principal.actorId, id, body.status, body.error);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const principal = requirePermission(req.principal, 'security.write');
    return this.connectors.remove(principal.tenantId, principal.actorId, id);
  }
}
