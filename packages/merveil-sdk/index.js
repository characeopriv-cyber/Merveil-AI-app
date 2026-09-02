const DEFAULT_BASE_URL = 'https://api.merveil.ai/api/v1';

export class MerveilError extends Error {
  constructor(message, { status = 0, code = 'request_failed', requestId = null, details = null } = {}) {
    super(message);
    this.name = 'MerveilError';
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.details = details;
  }
}

function cleanBase(value) {
  return String(value || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

export class Merveil {
  constructor({ apiKey, accessToken, baseUrl = DEFAULT_BASE_URL, timeout = 30000, fetch: fetchImpl } = {}) {
    if (!apiKey && !accessToken) throw new Error('Merveil requires apiKey or accessToken');
    this.apiKey = apiKey || null;
    this.accessToken = accessToken || null;
    this.baseUrl = cleanBase(baseUrl);
    this.timeout = Math.max(1000, Number(timeout) || 30000);
    this.fetch = fetchImpl || globalThis.fetch;
    if (typeof this.fetch !== 'function') throw new Error('A fetch implementation is required');
  }

  async request(path, { method = 'GET', body, query, headers = {}, retries = 2 } = {}) {
    const url = new URL(`${this.baseUrl}/${String(path).replace(/^\/+/, '')}`);
    for (const [key, value] of Object.entries(query || {})) {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
    }
    const requestId = globalThis.crypto?.randomUUID?.() || `mv_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const finalHeaders = { Accept: 'application/json', 'X-Request-Id': requestId, ...headers };
    if (this.apiKey) finalHeaders['X-API-Key'] = this.apiKey;
    if (this.accessToken) finalHeaders.Authorization = `Bearer ${this.accessToken}`;
    if (body !== undefined) { finalHeaders['Content-Type'] = 'application/json'; }

    let lastError;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);
      try {
        const response = await this.fetch(url, { method, headers: finalHeaders, body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal });
        clearTimeout(timer);
        const text = await response.text();
        let payload = null;
        try { payload = text ? JSON.parse(text) : null; } catch { payload = { raw: text }; }
        if (response.ok) return payload;
        const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
        const err = new MerveilError(payload?.message || payload?.error || `Merveil API request failed (${response.status})`, { status: response.status, code: payload?.error, requestId: response.headers.get('x-request-id') || requestId, details: payload });
        if (!retryable || attempt === retries) throw err;
        lastError = err;
      } catch (error) {
        clearTimeout(timer);
        if (error instanceof MerveilError) { lastError = error; if (error.status && error.status < 500 && error.status !== 429) throw error; }
        else lastError = new MerveilError(error?.message || 'Network request failed', { code: 'network_error', requestId });
        if (attempt === retries) throw lastError;
      }
      await new Promise(resolve => setTimeout(resolve, Math.min(2000, 250 * (2 ** attempt))));
    }
    throw lastError || new MerveilError('Merveil API request failed');
  }

  health() { return this.request('/health'); }
  catalog() { return this.request('/catalog'); }
  profile(query) { return this.request('/profile', { query }); }
  passport(query) { return this.request('/passport', { query }); }
  verification(query) { return this.request('/verification', { query }); }
  connect(query) { return this.request('/connect', { query }); }
  createConnect(body) { return this.request('/connect', { method: 'POST', body }); }
  messages(query) { return this.request('/messages', { query }); }
  ai({ messages, capability = 'general', max_tokens, temperature, ...extra } = {}) { return this.request('/ai', { method: 'POST', body: { messages, capability, ...(max_tokens == null ? {} : { max_tokens }), ...(temperature == null ? {} : { temperature }), ...extra } }); }
  call(query) { return this.request('/call', { query }); }
  createCall(body) { return this.request('/call', { method: 'POST', body }); }
  companies(query) { return this.request('/companies', { query }); }
  createCompany(body) { return this.request('/companies', { method: 'POST', body }); }
  properties(query) { return this.request('/properties', { query }); }
  createProperty(body) { return this.request('/properties', { method: 'POST', body }); }
  world(query) { return this.request('/world', { query }); }
  createWorld(body) { return this.request('/world', { method: 'POST', body }); }
  investors(query) { return this.request('/investors', { query }); }
  credits(query) { return this.request('/credits', { query }); }
  usage(query) { return this.request('/usage', { query }); }
  apps(query) { return this.request('/apps', { query }); }
  createApp(body) { return this.request('/apps', { method: 'POST', body }); }
  updateApp(query, body) { return this.request('/apps', { method: 'PATCH', query, body }); }
  revokeApp(query) { return this.request('/apps', { method: 'DELETE', query }); }
  webhooks(query) { return this.request('/webhooks', { query }); }
  createWebhook(body) { return this.request('/webhooks', { method: 'POST', body }); }
  deleteWebhook(query) { return this.request('/webhooks', { method: 'DELETE', query }); }
  oauth(query) { return this.request('/oauth', { query }); }
  createOAuth(body) { return this.request('/oauth', { method: 'POST', body }); }
  billing(query) { return this.request('/billing', { query }); }
  billingAction(body) { return this.request('/billing', { method: 'POST', body }); }
  organization(query) { return this.request('/organization', { query }); }
  organizationAction(body) { return this.request('/organization', { method: 'POST', body }); }
  upgrade(plan_code, organization_id) { return this.organizationAction({ action: 'upgrade', plan_code, ...(organization_id ? { organization_id } : {}) }); }
}

export const capabilities = Object.freeze(['general','website','game','agent','real_estate','business','trading','vision','image','video','voice']);
export default Merveil;
