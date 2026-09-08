import { MqttAdapter } from './mqtt.adapter';

describe('MqttAdapter', () => {
  const registry = { register: jest.fn() } as any;
  const moduleRef = { get: jest.fn() } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.MACHINE_CONNECT_MQTT_URL;
  });

  afterEach(() => {
    delete process.env.MACHINE_CONNECT_MQTT_URL;
  });

  it('stays disabled and disconnected when no broker is configured', () => {
    const adapter = new MqttAdapter(registry, moduleRef);
    adapter.onModuleInit();
    expect(adapter.isConnected()).toBe(false);
    expect(registry.register).not.toHaveBeenCalled();
  });

  it('rejects malformed MQTT payloads before authentication', async () => {
    const adapter = new MqttAdapter(registry, moduleRef);
    await expect((adapter as any).handleMessage('machine-connect/tenant/machine/telemetry', Buffer.from('{bad'))).resolves.toBeUndefined();
    expect(moduleRef.get).not.toHaveBeenCalled();
  });

  it('rejects unauthenticated telemetry without touching persistence', async () => {
    const credentials = { verify: jest.fn().mockResolvedValue(false) };
    const telemetry = { append: jest.fn() };
    moduleRef.get.mockImplementation((token: unknown) => token === undefined ? undefined : token);
    moduleRef.get.mockReturnValueOnce(credentials).mockReturnValueOnce(telemetry);

    const adapter = new MqttAdapter(registry, moduleRef);
    await (adapter as any).handleMessage(
      'machine-connect/tenant-1/machine-1/telemetry',
      Buffer.from(JSON.stringify({ credential: 'mc_invalid', data: { temperature: 20 } })),
    );

    expect(credentials.verify).toHaveBeenCalledWith('tenant-1', 'machine-1', 'mc_invalid');
    expect(telemetry.append).not.toHaveBeenCalled();
  });

  it('accepts authenticated heartbeat and updates machine liveness', async () => {
    const credentials = { verify: jest.fn().mockResolvedValue(true) };
    const telemetry = { heartbeat: jest.fn().mockResolvedValue(undefined) };
    moduleRef.get.mockReturnValueOnce(credentials).mockReturnValueOnce(telemetry);

    const adapter = new MqttAdapter(registry, moduleRef);
    await (adapter as any).handleMessage(
      'machine-connect/tenant-1/machine-1/heartbeat',
      Buffer.from(JSON.stringify({ credential: 'mc_valid' })),
    );

    expect(credentials.verify).toHaveBeenCalledWith('tenant-1', 'machine-1', 'mc_valid');
    expect(telemetry.heartbeat).toHaveBeenCalledWith('tenant-1', 'machine-1');
  });

  it('accepts authenticated ACK and correlates the command to the machine', async () => {
    const credentials = { verify: jest.fn().mockResolvedValue(true) };
    const commands = { acknowledgeMachine: jest.fn().mockResolvedValue(undefined) };
    moduleRef.get.mockReturnValueOnce(credentials).mockReturnValueOnce(commands);

    const adapter = new MqttAdapter(registry, moduleRef);
    await (adapter as any).handleMessage(
      'machine-connect/tenant-1/machine-1/acks',
      Buffer.from(JSON.stringify({ credential: 'mc_valid', commandId: 'cmd-123' })),
    );

    expect(commands.acknowledgeMachine).toHaveBeenCalledWith('tenant-1', 'machine-1', 'cmd-123');
  });
});
