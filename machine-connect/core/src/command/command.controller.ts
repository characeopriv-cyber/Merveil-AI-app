import { Body, Controller, Headers, Param, Post } from '@nestjs/common';
import { CommandStatus } from '../domain/command';
import { CommandService } from './command.service';

@Controller('api/machines')
export class CommandController {
  constructor(private readonly commands: CommandService) {}

  @Post(':machineId/commands')
  request(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-actor-id') requestedBy: string,
    @Param('machineId') machineId: string,
    @Body() body: { capability: string; parameters?: Record<string, unknown>; idempotencyKey: string; safetyClass?: 'read' | 'control' | 'critical'; capabilityKnown?: boolean },
  ) {
    if (!tenantId?.trim() || !requestedBy?.trim()) throw new Error('Authenticated tenant and actor context are required');
    return this.commands.request({
      tenantId: tenantId.trim(),
      machineId,
      requestedBy: requestedBy.trim(),
      capability: body.capability,
      parameters: body.parameters ?? {},
      idempotencyKey: body.idempotencyKey,
      safetyClass: body.safetyClass,
      capabilityKnown: body.capabilityKnown,
    });
  }

  @Post('commands/:commandId/transition')
  transition(@Param('commandId') commandId: string, @Body() body: { status: CommandStatus }) {
    return this.commands.transition(commandId, body.status);
  }
}
