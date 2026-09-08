const crypto = require('node:crypto');

const DEFAULT_BATCH_SIZE = 100;
const DEFAULT_LEASE_MS = 30_000;
const DEFAULT_MAX_ATTEMPTS = 10;

function buildSyncEnvelope(row) {
  if (!row || !Number.isSafeInteger(Number(row.id))) throw new Error('invalid sync queue row');
  return { queue_id: String(row.id), table_name: row.table_name, record_id: row.record_id, operation: row.operation, data: row.data ?? null, idempotency_key: `offline-sync:${row.id}` };
}
function nextBackoffMs(attempts) {
  const n = Math.max(0, Number(attempts) || 0);
  return Math.min(60 * 60 * 1000, 1000 * (2 ** Math.min(n, 16)));
}
async function claimReadyRows(pool, batchSize = DEFAULT_BATCH_SIZE, leaseMs = DEFAULT_LEASE_MS) {
  const limit = Math.min(Math.max(Number(batchSize) || DEFAULT_BATCH_SIZE, 1), 500);
  const cutoff = new Date(Date.now() - leaseMs);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(`SELECT id, table_name, record_id, operation, data, attempts FROM sync_queue WHERE synced = false AND dead_lettered = false AND next_attempt_at <= now() AND (claimed_at IS NULL OR claimed_at < $1) ORDER BY created_at, id FOR UPDATE SKIP LOCKED LIMIT $2`, [cutoff, limit]);
    const rows = result.rows.map(row => ({ ...row, claim_id: crypto.randomUUID() }));
    for (const row of rows) await client.query('UPDATE sync_queue SET claimed_at = now(), claim_id = $1 WHERE id = $2', [row.claim_id, row.id]);
    await client.query('COMMIT');
    return rows;
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
async function handleTransportResult(pool, row, result, maxAttempts = DEFAULT_MAX_ATTEMPTS) {
  const attempts = Number(row.attempts) || 0;
  if (result?.confirmed && !result.conflict && !result.rejected) {
    await pool.query('UPDATE sync_queue SET synced = true, synced_at = now(), claimed_at = NULL, claim_id = NULL, last_error = NULL WHERE id = $1 AND claim_id = $2', [row.id, row.claim_id]);
    await pool.query('UPDATE sync_checkpoints SET last_success_at = now(), last_queue_id = $1, last_error = NULL WHERE id = true', [row.id]);
    return 'synced';
  }
  if (result?.conflict) {
    await pool.query('INSERT INTO sync_conflicts (sync_queue_id, table_name, record_id, local_data, remote_data, reason) VALUES ($1, $2, $3, $4, $5, $6)', [row.id, row.table_name, row.record_id, row.data ?? null, result.remote_data ?? null, result.reason || 'sync conflict']);
    await pool.query('UPDATE sync_queue SET claimed_at = NULL, claim_id = NULL, last_error = $2 WHERE id = $1 AND claim_id = $3', [row.id, result.reason || 'sync conflict', row.claim_id]);
    return 'conflict';
  }
  const nextAttempts = attempts + 1;
  if (result?.rejected && nextAttempts >= maxAttempts) {
    await pool.query('UPDATE sync_queue SET attempts = $1, dead_lettered = true, claimed_at = NULL, claim_id = NULL, last_error = $2 WHERE id = $3 AND claim_id = $4', [nextAttempts, result.reason || 'cloud rejected after retry ceiling', row.id, row.claim_id]);
    return 'dead-lettered';
  }
  const reason = result?.reason || 'unconfirmed transport result';
  await pool.query("UPDATE sync_queue SET attempts = $1, next_attempt_at = now() + ($2 * interval '1 millisecond'), claimed_at = NULL, claim_id = NULL, last_error = $3 WHERE id = $4 AND claim_id = $5", [nextAttempts, nextBackoffMs(attempts), reason, row.id, row.claim_id]);
  await pool.query('UPDATE sync_checkpoints SET last_failure_at = now(), last_queue_id = $1, last_error = $2 WHERE id = true', [row.id, reason]);
  return 'retry';
}
module.exports = { DEFAULT_BATCH_SIZE, DEFAULT_LEASE_MS, DEFAULT_MAX_ATTEMPTS, buildSyncEnvelope, nextBackoffMs, claimReadyRows, handleTransportResult };
