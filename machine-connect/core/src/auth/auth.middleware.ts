import { Injectable, NestMiddleware, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrincipalRole } from './principal';
import { scryptSync, timingSafeEqual } from 'node:crypto';

type RequestLike = {
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  user?: { actorId: string; tenantId: string; roles: PrincipalRole[]; authenticated: true };
};

const PLATFORM_ROLES: PrincipalRole[] = ['owner', 'admin', 'operator', 'viewer', 'security_analyst', 'land_registry_officer', 'data_scientist'];

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  async use(req: RequestLike, _res: unknown, next: () => void) {
    const path = (req.url ?? '').split('?')[0];
    if (path === '/api/health' || path === '/api/ready' || path === '/health' || path === '/ready') { next(); return; }

    const machineRoute = path.match(/^\/api\/machines\/([^/]+)\/(?:commands\/[^/]+\/ack|sync\/telemetry)$/);
    const machineCredential = typeof req.headers['x-machine-credential'] === 'string' ? req.headers['x-machine-credential'].trim() : '';
    if (machineRoute && machineCredential) {
      const machineId = machineRoute[1];
      const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !supabaseKey) throw new UnauthorizedException('Machine authentication is not configured');
      const url = new URL(`${supabaseUrl}/rest/v1/machine_connect_credentials`);
      url.searchParams.set('select', 'organization_id,secret_hash,secret_salt');
      url.searchParams.set('machine_id', `eq.${machineId}`);
      url.searchParams.set('revoked_at', 'is.null');
      url.searchParams.set('order', 'created_at.desc');
      url.searchParams.set('limit', '1');
      const response = await fetch(url, { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } });
      if (!response.ok) throw new UnauthorizedException('Machine credential could not be verified');
      const rows = await response.json() as Array<{ organization_id?: string; secret_hash?: string; secret_salt?: string }>;
      const row = rows[0];
      if (!row?.organization_id || !row.secret_hash || !row.secret_salt) throw new UnauthorizedException('Invalid or revoked machine credential');
      const supplied = scryptSync(machineCredential, Buffer.from(row.secret_salt, 'base64url'), 32);
      const stored = Buffer.from(row.secret_hash, 'base64url');
      if (supplied.length !== stored.length || !timingSafeEqual(supplied, stored)) throw new UnauthorizedException('Invalid or revoked machine credential');
      req.user = { actorId: `machine:${machineId}`, tenantId: row.organization_id, roles: ['operator'], authenticated: true };
      next(); return;
    }

    const authorization = req.headers.authorization;
    const token = typeof authorization === 'string' && authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, '');
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const tenantId = typeof req.headers['x-tenant-id'] === 'string' ? req.headers['x-tenant-id'].trim() : '';
    if (!token || !supabaseUrl || !supabaseKey || !tenantId) throw new UnauthorizedException('Authenticated session and organization are required');
    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: supabaseKey, Authorization: `Bearer ${token}` } });
    if (!userResponse.ok) throw new UnauthorizedException('Invalid or expired session');
    const user = await userResponse.json() as { id?: string };
    if (!user.id) throw new UnauthorizedException('Invalid session principal');
    const membershipUrl = new URL(`${supabaseUrl}/rest/v1/organization_members`);
    membershipUrl.searchParams.set('select', 'role'); membershipUrl.searchParams.set('organization_id', `eq.${tenantId}`); membershipUrl.searchParams.set('user_id', `eq.${user.id}`); membershipUrl.searchParams.set('limit', '1');
    const membershipResponse = await fetch(membershipUrl, { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } });
    if (!membershipResponse.ok) throw new ForbiddenException('Organization membership could not be verified');
    const memberships = await membershipResponse.json() as Array<{ role?: string }>;
    if (!memberships.length) throw new ForbiddenException('User is not a member of this organization');
    const rawRole = memberships[0].role?.trim() as PrincipalRole | undefined;
    req.user = { actorId: user.id, tenantId, roles: [rawRole && PLATFORM_ROLES.includes(rawRole) ? rawRole : 'viewer'], authenticated: true };
    next();
  }
}
