import { Injectable } from '@nestjs/common';

export type MachineConnectRealtimeEvent = {
  table: 'machine_connect_machines' | 'machine_connect_commands' | 'machine_connect_telemetry' | 'machine_connect_events';
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  organizationId: string;
  record: Record<string, unknown>;
  oldRecord?: Record<string, unknown>;
};

@Injectable()
export class SupabaseRealtime {
  private readonly subscribers = new Set<(event: MachineConnectRealtimeEvent) => void>();

  subscribe(listener: (event: MachineConnectRealtimeEvent) => void): () => void {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  }

  publish(event: MachineConnectRealtimeEvent): void {
    for (const listener of this.subscribers) listener(event);
  }
}
