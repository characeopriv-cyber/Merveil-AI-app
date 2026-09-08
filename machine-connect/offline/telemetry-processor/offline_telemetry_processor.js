const mqtt = require('mqtt');
const { Pool } = require('pg');

const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://mc:mcpass@localhost:5432/machineconnect';
const TOPIC = process.env.MQTT_TELEMETRY_TOPIC || 'devices/+/telemetry';
const MAX_PAYLOAD_BYTES = Number(process.env.MAX_PAYLOAD_BYTES || 262144);

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX || 5),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const client = mqtt.connect(MQTT_URL, {
  reconnectPeriod: 2000,
  connectTimeout: 10000,
  clean: true,
  clientId: process.env.MQTT_CLIENT_ID || `mc-offline-processor-${process.pid}`,
});

let processing = Promise.resolve();
let shuttingDown = false;

function validDeviceId(value) {
  return /^[A-Za-z0-9._:-]{1,128}$/.test(value);
}

function topicDeviceId(topic) {
  const parts = topic.split('/');
  if (parts.length !== 3 || parts[0] !== 'devices' || parts[2] !== 'telemetry') return null;
  return validDeviceId(parts[1]) ? parts[1] : null;
}

async function audit(action, details) {
  try {
    await pool.query(
      'insert into audit_logs (action, resource_type, details) values ($1, $2, $3)',
      [action, 'offline-telemetry', JSON.stringify(details)],
    );
  } catch (error) {
    console.error('Audit write failed:', error.message);
  }
}

async function ensureDevice(deviceId, payload) {
  await pool.query(
    `insert into devices (device_id, name, type, protocol, status, last_seen, metadata)
     values ($1, $2, 'sensor', 'mqtt', 'online', now(), $3)
     on conflict (device_id) do update
       set status = 'online', last_seen = now(), metadata = devices.metadata || excluded.metadata,
           updated_at = now()`,
    [deviceId, deviceId, JSON.stringify({
      source: 'offline-mqtt',
      simulator: payload.device_id === deviceId,
    })],
  );
}

function observedAt(payload) {
  if (payload.timestamp === undefined || payload.timestamp === null) return new Date();
  const seconds = Number(payload.timestamp);
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > 4102444800) return null;
  const date = new Date(seconds * 1000);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function storeTelemetry(topic, message) {
  if (message.length > MAX_PAYLOAD_BYTES) {
    await audit('telemetry_rejected', { topic, reason: 'payload_too_large', bytes: message.length });
    return;
  }

  const deviceId = topicDeviceId(topic);
  if (!deviceId) {
    await audit('telemetry_rejected', { topic, reason: 'invalid_topic_or_device_id' });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(message.toString('utf8'));
  } catch (error) {
    await audit('telemetry_parse_failed', { topic, error: String(error) });
    return;
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    await audit('telemetry_rejected', { topic, reason: 'payload_must_be_object' });
    return;
  }

  const timestamp = observedAt(payload);
  if (!timestamp) {
    await audit('telemetry_rejected', { topic, reason: 'invalid_timestamp' });
    return;
  }

  const sequence = payload.sequence === undefined ? null : Number(payload.sequence);
  if (sequence !== null && (!Number.isSafeInteger(sequence) || sequence < 0)) {
    await audit('telemetry_rejected', { topic, reason: 'invalid_sequence' });
    return;
  }

  await ensureDevice(deviceId, payload);

  const result = await pool.query(
    `insert into telemetry (device_id, observed_at, sequence_no, data)
     values ($1, $2, $3, $4)
     on conflict (device_id, sequence_no) where sequence_no is not null do nothing
     returning id`,
    [deviceId, timestamp, sequence, JSON.stringify(payload)],
  );

  if (result.rowCount === 1) {
    await pool.query(
      `insert into sync_queue (table_name, record_id, operation, data)
       values ('telemetry', $1, 'insert', $2)`,
      [String(result.rows[0].id), JSON.stringify({ device_id: deviceId, ...payload })],
    );
    console.log('Stored telemetry for', deviceId);
  } else {
    console.log('Ignored duplicate telemetry for', deviceId);
  }
}

client.on('connect', () => {
  client.subscribe(TOPIC, { qos: 1 }, (error) => {
    if (error) console.error('MQTT subscribe failed:', error.message);
    else console.log('Subscribed to', TOPIC);
  });
});

client.on('message', (topic, message) => {
  if (shuttingDown) return;
  processing = processing
    .then(() => storeTelemetry(topic, message))
    .catch((error) => console.error('Telemetry storage failed:', error.message));
});

client.on('error', (error) => console.error('MQTT error:', error.message));
client.on('offline', () => console.warn('MQTT offline; waiting for reconnect'));

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  client.end(true);
  await processing;
  await pool.end();
}

process.once('SIGINT', () => shutdown().catch((error) => { console.error(error); process.exitCode = 1; }));
process.once('SIGTERM', () => shutdown().catch((error) => { console.error(error); process.exitCode = 1; }));
