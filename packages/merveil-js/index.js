export class MerveilError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'MerveilError';
    this.status = details.status ?? null;
    this.code = details.code ?? 'merveil_error';
    this.requestId = details.requestId ?? null;
    this.details = details.details ?? null;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default class Merveil {
  constructor({ apiKey, accessToken, baseUrl = 'https://api.merveil.ai/api/v1', timeout = 30000, retries = 2, fetchImpl = globalThis.fetch } = {}) {
    if (!apiKey && !accessToken) throw new MerveilError('apiKey or accessToken is required', { code: 'missing_credentials' });
    if (typeof fetchImpl !== 'function') throw new MerveilError('Fetch implementation is required', { code: 'missing_fetch' });
    this.apiKey = apiKey;
    this.accessToken = accessToken;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeout = timeout;
    this.retries = Math.max(0, Math.min(Number(retries) || 0, 5));
    this.fetch = fetchImpl;
  }

  async request(method, path, body, options = {}) {
    const headers = { Accept: 'application/json', ...(options.headers || {}) };
    if (this.apiKey) headers['X-API-Key'] = this.apiKey;
    if (this.accessToken) headers.Authorization = `Bearer ${this.accessToken}`;
    if (body !== undefined) { headers['Content-Type'] = 'application/json'; }
    if (options.requestId) headers['X-Request-Id'] = options.requestId;

    let lastError;
    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), options.timeout ?? this.timeout);
      try {
        const response = await this.fetch(`${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`, {
          method,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: controller.signal
        });
        const text = await response.text();
        let data = null;
        try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
        const requestId = response.headers.get('X-Request-Id') || data?.request_id || null;
        if (response.ok) return data;
        const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
        lastError = new MerveilError(data?.error?.message || data?.message || `Merveil API request failed (${response.status})`, {
          status: response.status,
          code: data?.error?.code || data?.code || 'api_error',
          requestId,
          details: data
        });
        if (!retryable || attempt === this.retries) throw lastError;
        const retryAfter = Number(response.headers.get('Retry-After'));
        await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt);
      } catch (error) {
        if (error instanceof MerveilError) throw error;
        lastError = new MerveilError(error?.name === 'AbortError' ? 'Merveil API request timed out' : (error?.message || 'Merveil API request failed'), { code: error?.name === 'AbortError' ? 'timeout' : 'network_error' });
        if (attempt === this.retries) throw lastError;
        await sleep(250 * 2 ** attempt);
      } finally { clearTimeout(timer); }
    }
    throw lastError;
  }

  health(options) { return this.request('GET', '/health', undefined, options); }
  catalog(options) { return this.request('GET', '/catalog', undefined, options); }
  ai(body, options) { return this.request('POST', '/ai', body, options); }
  profile(options) { return this.request('GET', '/profile', undefined, options); }
  passport(options) { return this.request('GET', '/passport', undefined, options); }
  verification(options) { return this.request('GET', '/verification', undefined, options); }
  connect(options) { return this.request('GET', '/connect', undefined, options); }
  createConnection(body, options) { return this.request('POST', '/connect', body, options); }
  messages(options) { return this.request('GET', '/messages', undefined, options); }
  call(options) { return this.request('GET', '/call', undefined, options); }
  createCall(body, options) { return this.request('POST', '/call', body, options); }
  world(options) { return this.request('GET', '/world', undefined, options); }
  createWorld(body, options) { return this.request('POST', '/world', body, options); }
  properties(options) { return this.request('GET', '/properties', undefined, options); }
  createProperty(body, options) { return this.request('POST', '/properties', body, options); }
  companies(options) { return this.request('GET', '/companies', undefined, options); }
  createCompany(body, options) { return this.request('POST', '/companies', body, options); }
  investors(options) { return this.request('GET', '/investors', undefined, options); }
  webhooks(options) { return this.request('GET', '/webhooks', undefined, options); }
  createWebhook(body, options) { return this.request('POST', '/webhooks', body, options); }
  deleteWebhook(body, options) { return this.request('DELETE', '/webhooks', body, options); }
  oauth(options) { return this.request('GET', '/oauth', undefined, options); }
  usage(options) { return this.request('GET', '/usage', undefined, options); }
  apps(options) { return this.request('GET', '/apps', undefined, options); }
  organization(options) { return this.request('GET', '/organization', undefined, options); }
  createOrganization(body, options) { return this.request('POST', '/organization', body, options); }
  billing(options) { return this.request('GET', '/billing', undefined, options); }
  updateBilling(body, options) { return this.request('POST', '/billing', body, options); }
}

export { Merveil };
