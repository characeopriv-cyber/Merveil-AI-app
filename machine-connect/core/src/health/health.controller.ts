import { Controller, Get } from '@nestjs/common';
import { MqttAdapter } from '../adapters/mqtt.adapter';

@Controller()
export class HealthController {
  constructor(private readonly mqtt: MqttAdapter) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'machine-connect-core',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  ready() {
    const supabaseConfigured = Boolean(
      process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
    const mqttConfigured = Boolean(process.env.MACHINE_CONNECT_MQTT_URL);
    const mqttConnected = this.mqtt.isConnected();
    const persistenceReady = supabaseConfigured;
    const transportReady = !mqttConfigured || mqttConnected;

    return {
      status: persistenceReady && transportReady ? 'ready' : 'degraded',
      service: 'machine-connect-core',
      persistence: persistenceReady ? 'configured' : 'not-configured',
      transport: {
        mqtt: mqttConfigured ? (mqttConnected ? 'connected' : 'disconnected') : 'not-configured',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
