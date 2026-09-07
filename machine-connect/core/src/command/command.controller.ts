import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { CommandStatus } from '../domain/command';
import { CommandService } from './command.service';
import { Principal, requirePrincipal, requireRole } from '../auth/principal';

type RequestWithPrincipal = { user?: Principal };

@Controller('api/machines')
export class CommandController {
  constructor(private readonly commands: CommandService) {}

  @Post(':machineId/commands')
  request(@Req() req: RequestWithPrincipal, @Param('machineId') machineId: string, @Body() body: { capability: string; parameters?: Record<string, unknown>; idempotencyKey: string; safetyClass?: 'read' | 'control' | 'critical'; capabilityKnown?: boolean }) {
    const principal = requireRole(req.user, 'owner', 'admin', 'operator');
    return this.commands.request({
      tenantId: principal.tenantId,
      machineId,
      requestedBy: principal.actorId,
      capability: body.capability,
      parameters: body.parameters ?? {},
      idempotencyKey: body.idempotencyKey,
      safetyClass: body.safetyClass,
      capabilityKnown: body.capabilityKnown,
    });
  }

  @Post('commands/:commandId/transition')
  transition(@Req() req: RequestWithPrincipal, @Param('commandId') commandId: string, @Body() body: { status: CommandStatus }) {
    const principal = requireRole(req.user, 'owner', 'admin', 'operator');
    return this.commands.transition(principal.tenantId, commandId, body.status);
  }
}
