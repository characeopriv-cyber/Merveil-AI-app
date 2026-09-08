import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { IntelligenceJobService } from '../intelligence/intelligence-job.service';
import { TelemetryService } from '../telemetry/telemetry.service';
import { ConnectorService } from './connector.service';

const MAX_RESPONSE_BYTES = 64 * 1024;
const TIMEOUT_MS = 5000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class ConnectorSyncService {
  constructor(
    private readonly connectors: ConnectorService,
    private readonly telemetry: TelemetryService,
    private readonly jobs: IntelligenceJobService,
  ) {}

  async sync(organizationId: string, actorId: string, connectorId: string, machineId?: string): Promise<any> {
    const connector = await this.connectors.get(organizationId, connectorId);
    if (connector.status !== 'active') throw new BadRequestException('Connector must be active before synchronization');
    if (connector.health_status === 'blocked' || connector.health_status === 'unreachable') throw new BadRequestException('Connector health does not permit synchronization');
    if (connector.protocol !== 'https' || !connector.endpoint) throw new BadRequestException('Only configured HTTPS connectors support synchronization');

    const targetMachineId = machineId ?? connector.configuration?.machineId;
    if (!UUID.test(String(targetMachineId ?? ''))) throw new BadRequestException('A valid machineId is required for connector synchronization');

    const url = new URL(connector.endpoint);
    if (url.protocol !== 'https:' || this.isPrivateHost(url.hostname)) throw new BadRequestException('Private or non-HTTPS synchronization destinations are blocked');

    const started = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      headers: { accept: 'application/json,text/plain', 'user-agent': 'Machine-Connect-Sync/1.0' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const latencyMs = Date.now() - started;
    if (!response.ok) throw new BadRequestException(`Connector returned HTTP ${response.status}`);
    if (response.type === 'opaqueredirect' || response.status >= 300 && response.status < 400) throw new BadRequestException('Connector redirects are not supported');

    const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
    if (!(contentType.includes('application/json') || contentType.startsWith('text/plain'))) throw new BadRequestException('Connector response content type is not supported');

    const contentLength = Number(response.headers.get('content-length') ?? '0');
    if (contentLength > MAX_RESPONSE_BYTES) throw new BadRequestException('Connector response exceeds the 64 KiB limit');
    const body = await response.text();
    const bytes = Buffer.byteLength(body, 'utf8');
    if (bytes > MAX_RESPONSE_BYTES) throw new BadRequestException('Connector response exceeds the 64 KiB limit');

    let payload: unknown = body;
    if (contentType.includes('application/json')) {
      try { payload = JSON.parse(body); } catch { throw new BadRequestException('Connector returned invalid JSON'); }
    }

    const observedAt = new Date().toISOString();
    const digest = createHash('sha256').update(body).digest('hex');
    const source = `connector:${connector.provider}:${connector.id}`;
    const data = this.normalizePayload(payload, bytes, latencyMs, digest);
    const telemetry = await this.telemetry.append({
      tenantId: organizationId,
      machineId: targetMachineId,
      source,
      schemaVersion: 1,
      observedAt,
      sequence: undefined,
      quality: 'good',
      data,
    });

    const job = await this.jobs.enqueue(organizationId, actorId, {
      jobType: 'connector_sync',
      connectorId,
      payload: { telemetryId: telemetry.id, machineId: targetMachineId, bytes, latencyMs, digest },
    });

    return { connectorId, machineId: targetMachineId, telemetryId: telemetry.id, jobId: job.id, bytes, latencyMs, digest };
  }

  private normalizePayload(payload: unknown, bytes: number, latencyMs: number, digest: string): Record<string, unknown> {
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      return { ...(payload as Record<string, unknown>), _connector: { bytes, latencyMs, digest } };
    }
    return { value: payload, _connector: { bytes, latencyMs, digest } };
  }

  private isPrivateHost(host: string): boolean {
    const normalized = host.toLowerCase().replace(/\.$/, '');
    if (normalized === 'localhost' || normalized.endsWith('.localhost') || normalized === '0.0.0.0' || normalized === '::' || normalized === '::1') return true;
    const ipv4 = normalized.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (ipv4) {
      const a = Number(ipv4[1]); const b = Number(ipv4[2]);
      return a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
    }
    return normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb');
  }
}
