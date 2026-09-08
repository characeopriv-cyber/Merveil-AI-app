const DEFAULT_TIMEOUT_MS = 10_000;

function createCoreSyncTransport({ coreUrl, machineId, credential, timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = fetch }) {
  if (!coreUrl || !machineId || !credential) throw new Error('offline sync transport is not configured');
  const base = coreUrl.replace(/\/$/, '');
  return {
    async pushTelemetry(batch) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(`${base}/api/machines/${encodeURIComponent(machineId)}/sync/telemetry`, {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-machine-credential': credential },
          body: JSON.stringify({ items: batch }),
          signal: controller.signal,
        });
        const text = await response.text();
        let body = null;
        try { body = text ? JSON.parse(text) : null; } catch { body = null; }
        if (!response.ok) return { confirmed: false, rejected: response.status >= 400 && response.status < 500, reason: `core sync HTTP ${response.status}` };
        if (body?.confirmed !== true || !Array.isArray(body.items)) return { confirmed: false, reason: 'core sync response was not an explicit confirmation' };
        return { confirmed: true, items: body.items };
      } finally { clearTimeout(timer); }
    },
    async health() {
      const response = await fetchImpl(`${base}/api/ready`, { signal: AbortSignal.timeout(timeoutMs) });
      return response.ok;
    },
  };
}

module.exports = { DEFAULT_TIMEOUT_MS, createCoreSyncTransport };
