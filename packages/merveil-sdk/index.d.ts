export interface MerveilOptions {
  apiKey?: string;
  accessToken?: string;
  baseUrl?: string;
  timeout?: number;
  fetch?: typeof fetch;
}

export interface AiOptions {
  messages: Array<{ role: string; content: unknown }>;
  capability?: 'general'|'website'|'game'|'agent'|'real_estate'|'business'|'trading'|'vision'|'image'|'video'|'voice';
  max_tokens?: number;
  temperature?: number;
  [key: string]: unknown;
}

export class MerveilError extends Error {
  status: number;
  code: string;
  requestId: string | null;
  details: unknown;
}

export class Merveil {
  constructor(options?: MerveilOptions);
  request(path: string, options?: Record<string, unknown>): Promise<any>;
  health(): Promise<any>;
  catalog(): Promise<any>;
  profile(query?: Record<string, unknown>): Promise<any>;
  passport(query?: Record<string, unknown>): Promise<any>;
  verification(query?: Record<string, unknown>): Promise<any>;
  connect(query?: Record<string, unknown>): Promise<any>;
  createConnect(body: unknown): Promise<any>;
  messages(query?: Record<string, unknown>): Promise<any>;
  ai(options: AiOptions): Promise<any>;
  call(query?: Record<string, unknown>): Promise<any>;
  createCall(body: unknown): Promise<any>;
  companies(query?: Record<string, unknown>): Promise<any>;
  createCompany(body: unknown): Promise<any>;
  properties(query?: Record<string, unknown>): Promise<any>;
  createProperty(body: unknown): Promise<any>;
  world(query?: Record<string, unknown>): Promise<any>;
  createWorld(body: unknown): Promise<any>;
  investors(query?: Record<string, unknown>): Promise<any>;
  credits(query?: Record<string, unknown>): Promise<any>;
  usage(query?: Record<string, unknown>): Promise<any>;
  apps(query?: Record<string, unknown>): Promise<any>;
  createApp(body: unknown): Promise<any>;
  updateApp(query: Record<string, unknown>, body: unknown): Promise<any>;
  revokeApp(query: Record<string, unknown>): Promise<any>;
  webhooks(query?: Record<string, unknown>): Promise<any>;
  createWebhook(body: unknown): Promise<any>;
  deleteWebhook(query: Record<string, unknown>): Promise<any>;
  oauth(query?: Record<string, unknown>): Promise<any>;
  createOAuth(body: unknown): Promise<any>;
  billing(query?: Record<string, unknown>): Promise<any>;
  billingAction(body: unknown): Promise<any>;
  organization(query?: Record<string, unknown>): Promise<any>;
  organizationAction(body: unknown): Promise<any>;
  upgrade(plan_code: string, organization_id?: string): Promise<any>;
}

export const capabilities: readonly string[];
export default Merveil;
