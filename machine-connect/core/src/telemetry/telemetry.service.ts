import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TelemetryEnvelope } from '../domain/telemetry';

@Injectable()
export class TelemetryService {
  private readonly records = new Map<string, TelemetryEnvelope[]>();
  private readonly seen = new Set<string>();

  append(input: Omit<TelemetryEnvelope, 'id' | 'receivedAt'>): TelemetryEnvelope {
    const key = `${input.tenantId}:${input.machineId}:${input.source}:${input.sequence ?? input.observedAt}`;
    if (this.seen.has(key)) {
      const existing = this.records.get(input.machineId)?.find(r => `${r.tenantId}:${r.machineId}:${r.source}:${r.sequence ?? r.observedAt}` === key);
      if (existing) return existing;
    }
    const record: TelemetryEnvelope = { ...input, id: randomUUID(), receivedAt: new Date().toISOString() };
    const list = this.records.get(input.machineId) ?? [];
    list.push(record);
    list.sort((a, b) => a.observedAt.localeCompare(b.observedAt));
    this.records.set(input.machineId, list);
    this.seen.add(key);
    return record;
  }

  list(tenantId: string, machineId: string, limit = 100): TelemetryEnvelope[] {
    return (this.records.get(machineId) ?? []).filter(r => r.tenantId === tenantId).slice(-Math.min(limit, 1000));
  }
}
