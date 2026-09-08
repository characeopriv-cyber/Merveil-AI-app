const { claimReadyRows, buildSyncEnvelope, handleTransportResult } = require('./sync_transport_boundary');

function createSyncLoop({ pool, transport, intervalMs = 2000, batchSize = 100, maxAttempts = 10 }) {
  let timer = null;
  let running = false;
  let stopped = false;

  async function tick() {
    if (running || stopped) return;
    running = true;
    try {
      const rows = await claimReadyRows(pool, batchSize);
      if (!rows.length) return;
      const envelopes = rows.map(buildSyncEnvelope);
      const result = await transport.pushTelemetry(envelopes);
      const confirmations = new Map((result.items || []).map((item) => [String(item.queue_id), item]));
      for (const row of rows) {
        const item = confirmations.get(String(row.id));
        await handleTransportResult(pool, row, item ? { confirmed: item.confirmed === true } : result, maxAttempts);
      }
    } catch (error) {
      console.error('Offline sync cycle failed:', error.message);
    } finally {
      running = false;
    }
  }

  return {
    start() {
      if (timer || stopped) return;
      stopped = false;
      timer = setInterval(() => tick().catch((error) => console.error('Offline sync tick failed:', error.message)), intervalMs);
      void tick();
    },
    async stop() {
      stopped = true;
      if (timer) clearInterval(timer);
      timer = null;
      while (running) await new Promise((resolve) => setTimeout(resolve, 25));
    },
  };
}

module.exports = { createSyncLoop };
