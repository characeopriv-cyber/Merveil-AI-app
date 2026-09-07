import { Injectable } from '@nestjs/common';

@Injectable()
export class SupabaseRest {
  private readonly url = process.env.SUPABASE_URL;
  private readonly key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  get enabled(): boolean {
    return Boolean(this.url && this.key);
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (!this.url || !this.key) throw new Error('Supabase persistence is not configured');
    const response = await fetch(`${this.url}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(init.headers ?? {}),
      },
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Supabase REST ${response.status}: ${detail.slice(0, 500)}`);
    }
    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
  }
}
