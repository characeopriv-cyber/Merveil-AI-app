import { Body, Controller, Post } from '@nestjs/common';
import { MachineCredentialsService } from './machine-credentials.service';

type MqttAuthBody = {
  username?: string;
  password?: string;
  clientid?: string;
};

/**
 * EMQX HTTP authentication adapter.
 *
 * EMQX receives the machine identity as username and the one-time-issued
 * Machine Connect credential as password. The credential is validated by the
 * same MachineCredentialsService used by the native MQTT adapter and REST
 * machine-ingress path; no second token store is introduced.
 */
@Controller('api/mqtt')
export class MqttAuthController {
  constructor(private readonly credentials: MachineCredentialsService) {}

  @Post('auth')
  async authenticate(@Body() body: MqttAuthBody) {
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password.trim() : '';
    const clientId = typeof body.clientid === 'string' ? body.clientid.trim() : undefined;

    if (!username || !password) return { result: 'deny' };

    const allowed = await this.credentials.authenticateMqtt(username, password, clientId);
    return { result: allowed ? 'allow' : 'deny' };
  }
}
