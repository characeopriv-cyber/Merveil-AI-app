import { Injectable } from '@nestjs/common';
import { Adapter } from './adapter';

@Injectable()
export class AdapterRegistry {
  private readonly adapters = new Map<string, Adapter>();

  register(adapter: Adapter): void {
    if (this.adapters.has(adapter.id)) {
      throw new Error(`Adapter already registered: ${adapter.id}`);
    }
    this.adapters.set(adapter.id, adapter);
  }

  get(id: string): Adapter {
    const adapter = this.adapters.get(id);
    if (!adapter) throw new Error(`Adapter not found: ${id}`);
    return adapter;
  }

  has(id: string): boolean {
    return this.adapters.has(id);
  }

  list(): Array<{ id: string; protocol: string }> {
    return [...this.adapters.values()].map(({ id, protocol }) => ({ id, protocol }));
  }
}
