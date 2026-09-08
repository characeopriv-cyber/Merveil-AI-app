import { Body, Controller, Param, Post, Req, UnauthorizedException } from '@nestjs/common';
import { CommandStatus } from '../domain/command';
import { CommandService } from './command.service';
import { Principal } from '../auth/principal';
import { requirePermission } from '../auth/permissions';
import { MachineCredentialsService } from '../auth/machine-credentials.service';
import { MachineAckSignatureService } from '../security/machine-ack-signature.service';

type RequestWithPrincipal = { user?: Principal; headers?: Record<string, string | string[] | undefined> };
type CommandBody = { capability: string; parameters?: Record<string, unknown>; idempotencyKey: string; safetyClass?: 'control' | 'critical' };

@Controller('api/machines')
export class CommandController {
  constructor(private readonly commands: CommandService, private readonly credentials: MachineCredentialsService, private readonly ackSignatures: MachineAckSignatureService) {}
  @Post(':machineId/commands')
  request(@Req() req: RequestWithPrincipal, @Param('machineId') machineId: string, @Body() body: CommandBody) { const principal = requirePermission(req.user, 'device.control'); return this.commands.request({ tenantId: principal.tenantId, machineId, requestedBy: principal.actorId, capability: body.capability, parameters: body.parameters ?? {}, idempotencyKey: body.idempotencyKey, safetyClass: body.safetyClass ?? 'control', capabilityKnown: true }); }
  @Post('commands/:commandId/dispatch')
  dispatch(@Req() req: RequestWithPrincipal, @Param('commandId') commandId: string, @Body() body: { adapterId?: string }) { const principal = requirePermission(req.user, 'device.control'); return this.commands.dispatch(principal.tenantId, commandId, body.adapterId); }
  @Post(':machineId/commands/:commandId/ack')
  async acknowledgeMachine(@Req() req: RequestWithPrincipal, @Param('machineId') machineId: string, @Param('commandId') commandId: string) {
    const credentialHeader = req.headers?.['x-machine-credential']; const credential = Array.isArray(credentialHeader) ? credentialHeader[0] : credentialHeader;
    if (!credential) throw new UnauthorizedException('Missing machine credential');
    const principal = req.user;
    if (!principal || principal.actorId !== `machine:${machineId}`) throw new UnauthorizedException('Machine ACK requires authenticated machine principal');
    await this.credentials.require(principal.tenantId, machineId, credential);
    const get = (name: string) => { const value = req.headers?.[name]; return Array.isArray(value) ? value[0] : value; };
    await this.ackSignatures.verifyAndConsume({ tenantId: principal.tenantId, machineId, commandId, headers: { signature: get('x-machine-signature'), timestamp: get('x-machine-timestamp'), nonce: get('x-machine-nonce') } });
    return this.commands.acknowledgeMachine(principal.tenantId, machineId, commandId);
  }
  @Post('commands/:commandId/transition')
  transition(@Req() req: RequestWithPrincipal, @Param('commandId') commandId: string, @Body() body: { status: CommandStatus }) { const principal = requirePermission(req.user, 'device.control'); return this.commands.transition(principal.tenantId, commandId, body.status); }
}
