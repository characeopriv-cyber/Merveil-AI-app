import { Injectable, ServiceUnavailableException } from '@nestjs/common';

export interface RuntimeEntity { text: string; label: string; start: number; end: number; }
export interface RuntimeExtraction { text: string; sha256: string; byteSize: number; entities: RuntimeEntity[]; }

@Injectable()
export class IntelligenceRuntimeClient {
  private get url() { return process.env.MC_INTELLIGENCE_RUNTIME_URL?.replace(/\/$/, ''); }
  private get token() { return process.env.MC_INTELLIGENCE_RUNTIME_TOKEN ?? ''; }

  async extract(mimeType: string, bytes: Uint8Array): Promise<RuntimeExtraction> {
    if (!this.url) throw new ServiceUnavailableException('Intelligence runtime is not configured');
    const response = await fetch(`${this.url}/extract`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(this.token ? { 'x-runtime-token': this.token } : {}) },
      body: JSON.stringify({ mimeType, contentBase64: Buffer.from(bytes).toString('base64') }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) throw new Error(`Intelligence runtime ${response.status}: ${(await response.text()).slice(0, 500)}`);
    const data = await response.json() as Partial<RuntimeExtraction>;
    if (typeof data.text !== 'string' || typeof data.sha256 !== 'string' || typeof data.byteSize !== 'number' || !Array.isArray(data.entities)) {
      throw new Error('Invalid intelligence runtime response');
    }
    return { text: data.text, sha256: data.sha256, byteSize: data.byteSize, entities: data.entities as RuntimeEntity[] };
  }
}
