import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { CommandStatus } from '../domain/command';
import { CommandService } from './command.service';
import { Principal } from '../auth/principal';
import { requirePermission } from '../auth/permissions';

type RequestWithPrincipal = { user?: Principal };
type CommandBody = { capability: string; parameters?: Record<string, unknown>; idempotencyKey: string; safetyClass?: 'control' | 'critical' };

@Controller('api/machines')
export class CommandController {
  constructor(private readonly commands: CommandService) {}

  @Post(':machineId/commands')
  request(@Req() req: RequestWithPrincipal, @Param('machineId') machineId: string, @Body() body: CommandBody) {
    const principal = requirePermission(req.user, 'device.control');
    return this.commands.request({ tenantId: principal.tenantId, machineId, requestedBy: principal.actorId, capability: body.capability, parameters: body.parameters ?? {}, idempotencyKey: body.idempotencyKey, safetyClass: body.safetyClass ?? 'control', capabilityKnown: true });
  }

  @Post('commands/:commandId/dispatch')
  dispatch(@Req() req: RequestWithPrincipal, @Param('commandId') commandId: string, @Body() body: { adapterId?: string }) {
    const principal = requirePermission(req.user, 'device.control');
    return this.commands.dispatch(principal.tenantId, commandId, body.adapterId);
  }

  @Post('commands/:commandId/ack')
  acknowledge(@Req() req: RequestWithPrincipal, @Param('commandId') commandId: string) {
    const principal = requirePermission(req.user, 'device.control');
    return this.commands.transition(principal.tenantId, commandId, 'acknowledged');
  }

  @Post('commands/:commandId/transition')
  transition(@Req() req: RequestWithPrincipal, @Param('commandId') commandId: string, @Body() body: { status: CommandStatus }) {
    const principal = requirePermission(req.user, 'device.control');
    return this.commands.transition(principal.tenantId, commandId, body.status);
  }
}
