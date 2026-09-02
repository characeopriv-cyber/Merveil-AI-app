export interface MerveilRequestOptions {
  headers?: Record<string, string>;
  requestId?: string;
  timeout?: number;
}

export interface MerveilOptions {
  apiKey?: string;
  accessToken?: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
  fetchImpl?: typeof fetch;
}

export interface AiRequest {
  messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  prompt?: string;
  context?: Record<string, unknown>;
  capability?: string;
  maxTokens?: number;
  temperature?: number;
}

export class MerveilError extends Error {
  status: number | null;
  code: string;
  requestId: string | null;
  details: unknown;
}

export class Merveil {
  constructor(options?: MerveilOptions);
  request<T = any>(method: string, path: string, body?: unknown, options?: MerveilRequestOptions): Promise<T>;
  health<T = any>(options?: MerveilRequestOptions): Promise<T>;
  catalog<T = any>(options?: MerveilRequestOptions): Promise<T>;
  ai<T = any>(body: AiRequest, options?: MerveilRequestOptions): Promise<T>;
  profile<T = any>(options?: MerveilRequestOptions): Promise<T>;
  passport<T = any>(options?: MerveilRequestOptions): Promise<T>;
  verification<T = any>(options?: MerveilRequestOptions): Promise<T>;
  connect<T = any>(options?: MerveilRequestOptions): Promise<T>;
  createConnection<T = any>(body: unknown, options?: MerveilRequestOptions): Promise<T>;
  messages<T = any>(options?: MerveilRequestOptions): Promise<T>;
  call<T = any>(options?: MerveilRequestOptions): Promise<T>;
  createCall<T = any>(body: unknown, options?: MerveilRequestOptions): Promise<T>;
  world<T = any>(options?: MerveilRequestOptions): Promise<T>;
  createWorld<T = any>(body: unknown, options?: MerveilRequestOptions): Promise<T>;
  properties<T = any>(options?: MerveilRequestOptions): Promise<T>;
  createProperty<T = any>(body: unknown, options?: MerveilRequestOptions): Promise<T>;
  companies<T = any>(options?: MerveilRequestOptions): Promise<T>;
  createCompany<T = any>(body: unknown, options?: MerveilRequestOptions): Promise<T>;
  investors<T = any>(options?: MerveilRequestOptions): Promise<T>;
  webhooks<T = any>(options?: MerveilRequestOptions): Promise<T>;
  createWebhook<T = any>(body: unknown, options?: MerveilRequestOptions): Promise<T>;
  deleteWebhook<T = any>(body: unknown, options?: MerveilRequestOptions): Promise<T>;
  oauth<T = any>(options?: MerveilRequestOptions): Promise<T>;
  usage<T = any>(options?: MerveilRequestOptions): Promise<T>;
  apps<T = any>(options?: MerveilRequestOptions): Promise<T>;
  organization<T = any>(options?: MerveilRequestOptions): Promise<T>;
  createOrganization<T = any>(body: unknown, options?: MerveilRequestOptions): Promise<T>;
  billing<T = any>(options?: MerveilRequestOptions): Promise<T>;
  updateBilling<T = any>(body: unknown, options?: MerveilRequestOptions): Promise<T>;
}

export default Merveil;
