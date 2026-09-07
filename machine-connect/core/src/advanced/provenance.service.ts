import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

@Injectable()
export class ProvenanceService {
  hash(value: unknown): string {
    return createHash('sha256').update(this.canonicalize(value)).digest('hex');
  }

  private canonicalize(value: unknown): string {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map((x) => this.canonicalize(x)).join(',')}]`;
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${this.canonicalize(object[key])}`).join(',')}}`;
  }
}
