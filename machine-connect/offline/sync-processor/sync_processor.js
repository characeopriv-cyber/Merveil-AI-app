const { Pool } = require('pg');
const crypto = require('crypto');

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://mc:mcpass@localhost:5432/machineconnect';
const POLL_MS = Math.max(Number(process.env.SYNC_POLL_MS || 2000), 250);
const BATCH_SIZE = Math.min(Math.max(Number(process.env.SYNC_BATCH_SIZE || 25), 1), 100);
const MAX_ATTEMPTS = Math.max(Number(process.env.SYNC_MAX_ATTEMPTS || 12), 1);
const CLAIM_LEASE_MS = Math.max(Number(process.env.SYNC_CLAIM_LEASE_MS || 30000), 5000);
const pool = new Pool({ connectionString: DATABASE_URL, max: Number(process.env.PG_POOL_MAX || 5), idleTimeoutMillis: 30000, connectionTimeoutMillis: 10000 });
let running = false;
let stopping = false;

function backoff(attempts) { return Math.min(60_000, 1000 * 2 ** Math.min(attempts, 6)); }

async function claimBatch(client) {
  const claimId = crypto.randomUUID();
  const stale = new Date(Date.now() - CLAIM_LEASE_MS);
  const result = await client.query(
    `UPDATE sync_queue q SET claimed_at = now(), claim_id = $1
     WHERE q.id IN (
       SELECT id FROM sync_queue
       WHERE synced = false AND dead_lettered = false
         AND next_attempt_at <= now()
         AND (claimed_at IS NULL OR claimed_at < $2)
       ORDER BY created_at, id LIMIT $3 FOR UPDATE SKIP LOCKED
     ) RETURNING *`,
    [claimId, stale, BATCH_SIZE],
  );
  return result.rows;
}

async function markSuccess(client, row) {
  await client.query(
    `UPDATE sync_queue SET synced = true, synced_at = now(), claimed_at = NULL, claim_id = NULL, last_error = NULL
     WHERE id = $1 AND claim_id = $2`, [row.id, row.claim_id]);
  await client.query(
    `UPDATE sync_checkpoints SET last_success_at = now(), last_queue_id = $1, last_error = NULL WHERE id = true`, [row.id]);
}

async function markFailure(client, row, error) {
  const attempts = Number(row.attempts || 0) + 1;
  const dead = attempts >= MAX_ATTEMPTS;
  const next = new Date(Date.now() + backoff(attempts));
  await client.query(
    `UPDATE sync_queue SET attempts = $1, last_error = $2, next_attempt_at = $3,
       dead_lettered = $4, claimed_at = NULL, claim_id = NULL
     WHERE id = $5 AND claim_id = $6`,
    [attempts, String(error?.message || error).slice(0, 4000), next, dead, row.id, row.claim_id],
  );
  await client.query(
    `UPDATE sync_checkpoints SET last_failure_at = now(), last_queue_id = $1, last_error = $2 WHERE id = true`,
    [row.id, String(error?.message || error).slice(0, 4000)],
  );
}

async function processRow(client, row) {
  // This processor deliberately stops at the durable queue boundary. Cloud transport
  // adapters consume the same queue records and must call an authenticated Core sync API.
  // No offline process is allowed to bypass Core authorization or safety controls.
  if (!row.table_name || !row.record_id || !row.operation) throw new Error('invalid sync queue record');
  if (row.data === null && row.operation !== 'delete') throw new Error('missing sync payload');
  await markSuccess(client, row);
}

async function tick() {
  if (running || stopping) return;
  running = true;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const rows = await claimBatch(client);
    await client.query('COMMIT');
    for (const row of rows) {
      const item = await pool.connect();
      try {
        await item.query('BEGIN');
        await processRow(item, row);
        await item.query('COMMIT');
      } catch (error) {
        await item.query('ROLLBACK').catch(() => {});
        try { await item.query('BEGIN'); await markFailure(item, row, error); await item.query('COMMIT'); } catch { await item.query('ROLLBACK').catch(() => {}); }
      } finally { item.release(); }
    }
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('sync queue tick failed:', error.message);
  } finally { client.release(); running = false; }
}

const timer = setInterval(() => void tick(), POLL_MS);
void tick();

async function shutdown() {
  if (stopping) return;
  stopping = true;
  clearInterval(timer);
  while (running) await new Promise(resolve => setTimeout(resolve, 50));
  await pool.end();
}
process.once('SIGINT', () => shutdown().catch(() => { process.exitCode = 1; }));
process.once('SIGTERM', () => shutdown().catch(() => { process.exitCode = 1; }));
