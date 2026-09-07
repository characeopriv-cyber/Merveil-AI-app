import { Injectable } from '@nestjs/common';
import { Adapter, AdapterContext } from '../adapters/adapter';

@Injectable()
export class AdapterManagerService {
  private readonly adapters = new Map<string, Adapter>();
  register(adapter: Adapter) { if (!adapter.id || !adapter.protocol) throw new Error('Invalid adapter'); this.adapters.set(adapter.id, adapter); return adapter; }
  get(id: string) { return this.adapters.get(id); }
  list() { return [...this.adapters.values()].map(a => ({ id: a.id, protocol: a.protocol })); }
  async disconnectAll(context: AdapterContext) { await Promise.all([...this.adapters.values()].map(a => a.disconnect(context))); }
}
