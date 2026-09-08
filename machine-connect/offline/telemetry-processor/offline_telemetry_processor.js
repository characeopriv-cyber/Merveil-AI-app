const mqtt = require('mqtt');
const { Pool } = require('pg');

const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://mc:mcpass@localhost:5432/machineconnect';
const TOPIC = process.env.MQTT_TELEMETRY_TOPIC || 'devices/+/telemetry';

const pool = new Pool({ connectionString: DATABASE_URL });
const client = mqtt.connect(MQTT_URL, {
  reconnectPeriod: 2000,
  connectTimeout: 10000,
  clean: true,
});

async function ensureDevice(deviceId, payload) {
  await pool.query(
    `insert into devices (device_id, name, type, protocol, status, last_seen, metadata)
     values ($1, $2, 'sensor', 'mqtt', 'online', now(), $3)
     on conflict (device_id) do update
       set status = 'online', last_seen = now(), metadata = devices.metadata || excluded.metadata`,
    [deviceId, deviceId, JSON.stringify({ source: 'offline-mqtt', simulator: payload.device_id === deviceId })],
  );
}

async function storeTelemetry(topic, message) {
  const parts = topic.split('/');
  if (parts.length !== 3 || parts[0] !== 'devices' || parts[2] !== 'telemetry') return;

  const deviceId = parts[1];
  let payload;
  try {
    payload = JSON.parse(message.toString('utf8'));
  } catch (error) {
    await pool.query('insert into audit_logs (action, details) values ($1, $2)', [
      'telemetry_parse_failed', JSON.stringify({ topic, error: String(error) }),
    ]);
    return;
  }

  await ensureDevice(deviceId, payload);

  const eventId = payload.event_id || null;
  const sequence = Number.isInteger(payload.sequence) ? payload.sequence : null;
  const recordedAt = payload.timestamp ? new Date(Number(payload.timestamp) * 1000) : new Date();

  const result = await pool.query(
    `insert into telemetry (device_id, event_id, sequence, timestamp, data)
     values ($1, $2, $3, $4, $5)
     on conflict (event_id) do nothing`,
    [deviceId, eventId, sequence, recordedAt, JSON.stringify(payload)],
  );

  if (result.rowCount === 1) {
    await pool.query(
      `insert into sync_queue (table_name, record_id, operation, data)
       values ('telemetry', coalesce($1, ''), 'insert', $2)`,
      [eventId || `${deviceId}:${sequence ?? Date.now()}`, JSON.stringify({ device_id: deviceId, ...payload })],
    );
  }

  console.log(result.rowCount ? 'Stored telemetry for' : 'Ignored duplicate telemetry for', deviceId);
}

client.on('connect', () => {
  client.subscribe(TOPIC, { qos: 1 }, (error) => {
    if (error) console.error('MQTT subscribe failed:', error.message);
    else console.log('Subscribed to', TOPIC);
  });
});

client.on('message', (topic, message) => {
  storeTelemetry(topic, message).catch((error) => {
    console.error('Telemetry storage failed:', error.message);
  });
});

client.on('error', (error) => console.error('MQTT error:', error.message));
client.on('offline', () => console.warn('MQTT offline; waiting for reconnect'));

async function shutdown() {
  client.end(true);
  await pool.end();
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
