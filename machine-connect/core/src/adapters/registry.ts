export interface AdapterRegistration { id: string; protocol: string; capabilities: string[]; }

export class AdapterRegistry {
  private readonly adapters = new Map<string, AdapterRegistration>();
  register(adapter: AdapterRegistration): AdapterRegistration {
    if (!adapter.id || !adapter.protocol) throw new Error('Invalid adapter registration');
    this.adapters.set(adapter.id, Object.freeze({ ...adapter }));
    return adapter;
  }
  get(id: string): AdapterRegistration | undefined { return this.adapters.get(id); }
  list(): AdapterRegistration[] { return [...this.adapters.values()]; }
}
