import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import mqtt, { MqttClient } from 'mqtt';
import { Adapter, AdapterContext } from './adapter';
import { AdapterRegistry } from './adapter-registry';
import { MachineCredentialsService } from '../auth/machine-credentials.service';
import { TelemetryService } from '../telemetry/telemetry.service';
import { CommandService } from '../command/command.service';

/** Production MQTT bridge; disabled until MACHINE_CONNECT_MQTT_URL is configured. */
@Injectable()
export class MqttAdapter implements Adapter, OnModuleInit, OnModuleDestroy {
  readonly id = 'mqtt';
  readonly protocol = 'mqtt';
  private readonly logger = new Logger(MqttAdapter.name);
  private client?: MqttClient;

  constructor(private readonly registry: AdapterRegistry, private readonly moduleRef: ModuleRef) {}

  isConnected(): boolean { return this.client?.connected === true; }

  onModuleInit(): void {
    const url = process.env.MACHINE_CONNECT_MQTT_URL?.trim();
    if (!url) {
      this.logger.warn('MQTT transport disabled: MACHINE_CONNECT_MQTT_URL is not configured');
      return;
    }
    this.client = mqtt.connect(url, {
      username: process.env.MACHINE_CONNECT_MQTT_USERNAME,
      password: process.env.MACHINE_CONNECT_MQTT_PASSWORD,
      protocolVersion: 5,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
      clean: false,
      clientId: process.env.MACHINE_CONNECT_MQTT_CLIENT_ID ?? `merveil-machine-connect-${process.pid}`,
      rejectUnauthorized: process.env.MACHINE_CONNECT_MQTT_TLS_INSECURE !== 'true',
    });
    this.client.on('connect', () => {
      this.logger.log(`MQTT connected: ${url.replace(/\/\/.*@/, '//***@')}`);
      void this.client?.subscribe('machine-connect/+/+/telemetry', { qos: 1 });
      void this.client?.subscribe('machine-connect/+/+/heartbeat', { qos: 1 });
      void this.client?.subscribe('machine-connect/+/+/acks', { qos: 1 });
    });
    this.client.on('reconnect', () => this.logger.warn('MQTT reconnecting'));
    this.client.on('error', (error) => this.logger.error(`MQTT error: ${error.message}`));
    this.client.on('message', (topic, payload) => void this.handleMessage(topic, payload));
    this.registry.register(this);
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.client) return;
    await new Promise<void>((resolve) => this.client!.end(false, {}, () => resolve()));
  }

  async connect(_context: AdapterContext): Promise<void> {
    if (!this.client) throw new Error('MQTT transport is not configured');
    if (!this.client.connected) throw new Error('MQTT transport is not connected');
  }

  async disconnect(_context: AdapterContext): Promise<void> {}

  async publishTelemetry(context: AdapterContext, payload: Record<string, unknown>): Promise<void> {
    await this.publish(`machine-connect/${encodeURIComponent(context.tenantId)}/${encodeURIComponent(context.machineId)}/telemetry`, payload);
  }

  async dispatchCommand(context: AdapterContext, capability: string, parameters: Record<string, unknown>): Promise<void> {
    await this.publish(`machine-connect/${encodeURIComponent(context.tenantId)}/${encodeURIComponent(context.machineId)}/commands`, {
      commandId: parameters.commandId,
      capability,
      parameters,
      issuedAt: new Date().toISOString(),
    });
  }

  private async publish(topic: string, payload: Record<string, unknown>): Promise<void> {
    if (!this.client?.connected) throw new Error('MQTT transport is not connected');
    await new Promise<void>((resolve, reject) => {
      this.client!.publish(topic, JSON.stringify(payload), { qos: 1 }, (error) => error ? reject(error) : resolve());
    });
  }

  private async handleMessage(topic: string, payload: Buffer): Promise<void> {
    const parts = topic.split('/');
    if (parts.length !== 4 || parts[0] !== 'machine-connect') return;
    const [, tenantId, machineId, kind] = parts.map(decodeURIComponent);
    let body: any;
    try { body = JSON.parse(payload.toString('utf8')); } catch { this.logger.warn(`Rejected non-JSON MQTT message: ${topic}`); return; }
    const credentials = this.moduleRef.get(MachineCredentialsService, { strict: false });
    const credential = typeof body.credential === 'string' ? body.credential : '';
    if (!credentials || !credential || !(await credentials.verify(tenantId, machineId, credential))) {
      this.logger.warn(`Rejected unauthenticated MQTT ${kind}: ${tenantId}/${machineId}`);
      return;
    }
    if (kind === 'telemetry') {
      const telemetry = this.moduleRef.get(TelemetryService, { strict: false });
      if (telemetry) await telemetry.append({ tenantId, machineId, source: typeof body.source === 'string' ? body.source : 'mqtt', schemaVersion: Number(body.schemaVersion ?? 1), sequence: body.sequence == null ? undefined : Number(body.sequence), observedAt: typeof body.observedAt === 'string' ? body.observedAt : new Date().toISOString(), quality: typeof body.quality === 'string' ? body.quality : 'unknown', data: body.data && typeof body.data === 'object' ? body.data : {} });
      return;
    }
    if (kind === 'heartbeat') {
      const telemetry = this.moduleRef.get(TelemetryService, { strict: false });
      if (telemetry) await telemetry.heartbeat(tenantId, machineId);
      return;
    }
    if (kind === 'acks') {
      const commands = this.moduleRef.get(CommandService, { strict: false });
      const commandId = typeof body.commandId === 'string' ? body.commandId : '';
      if (commands && commandId) await commands.acknowledgeMachine(tenantId, machineId, commandId);
    }
  }
}
