export interface MachineConnectEvent<T = Record<string, unknown>> {
  id: string;
  type: string;
  tenantId: string;
  machineId?: string;
  occurredAt: string;
  payload: T;
}

export type EventHandler<T = Record<string, unknown>> = (event: MachineConnectEvent<T>) => Promise<void> | void;

export class EventBus {
  private readonly handlers = new Map<string, Set<EventHandler>>();

  subscribe(type: string, handler: EventHandler): () => void {
    const handlers = this.handlers.get(type) ?? new Set<EventHandler>();
    handlers.add(handler);
    this.handlers.set(type, handlers);
    return () => handlers.delete(handler);
  }

  async publish<T>(event: MachineConnectEvent<T>): Promise<void> {
    const handlers = this.handlers.get(event.type);
    if (!handlers) return;
    for (const handler of handlers) await handler(event as MachineConnectEvent);
  }
}
