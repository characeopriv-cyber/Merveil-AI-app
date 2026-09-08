import { Injectable, HttpException, HttpStatus, NestMiddleware } from '@nestjs/common';
import { RateLimitService } from './rate-limit.service';
import { SecurityEventService } from './security-event.service';

type RequestLike = { method?: string; url?: string; headers: Record<string, string | string[] | undefined>; user?: { actorId: string; tenantId: string; roles: string[]; authenticated: true } };
type ResponseLike = { header?: (name: string, value: string) => void };

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(private readonly limiter: RateLimitService, private readonly securityEvents: SecurityEventService) {}
  async use(req: RequestLike, res: ResponseLike, next: () => void) {
    const principal = req.user;
    if (!principal?.tenantId) { next(); return; }
    const path = (req.url ?? '').split('?')[0];
    const keyHeader = req.headers['x-api-key'];
    const apiKey = typeof keyHeader === 'string' ? keyHeader.trim() : '';
    const actorKey = apiKey ? `api:${apiKey.slice(0, 12)}` : `actor:${principal.actorId}`;
    const limit = apiKey ? 100 : 300;
    const allowed = await this.limiter.allow(principal.tenantId, `${actorKey}:${req.method ?? 'GET'}:${path}`, limit, 60);
    if (!allowed) {
      await this.securityEvents.record({ organizationId: principal.tenantId, actorId: principal.actorId, eventType: 'rate_limit.exceeded', severity: 'warn', requestId: undefined, resourceType: 'http', metadata: { method: req.method ?? 'GET', path, bucketType: apiKey ? 'api_key' : 'actor', limit } });
      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }
    res.header?.('X-RateLimit-Limit', String(limit));
    next();
  }
}
