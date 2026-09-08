import { Injectable, NestMiddleware, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrincipalRole } from './principal';
import { MachineCredentialsService } from './machine-credentials.service';

type RequestLike = {
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  user?: { actorId: string; tenantId: string; roles: PrincipalRole[]; authenticated: true };
};

const PLATFORM_ROLES: PrincipalRole[] = ['owner', 'admin', 'operator', 'viewer', 'security_analyst', 'land_registry_officer', 'data_scientist'];

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly machineCredentials: MachineCredentialsService) {}

  async use(req: RequestLike, _res: unknown, next: () => void) {
    const path = (req.url ?? '').split('?')[0];
    if (path === '/api/health' || path === '/api/ready' || path === '/health' || path === '/ready') { next(); return; }

    const machineRoute = path.match(/^\/api\/machines\/([^/]+)\/(?:commands\/[^/]+\/ack|sync\/telemetry)$/);
    const machineCredential = typeof req.headers['x-machine-credential'] === 'string' ? req.headers['x-machine-credential'].trim() : '';
    if (machineRoute && machineCredential) {
      const machineId = machineRoute[1];
      const credentialRows = await this.machineCredentials['db'].request<Array<{ organization_id?: string }>>(
        `machine_connect_credentials?select=organization_id&machine_id=eq.${encodeURIComponent(machineId)}&revoked_at=is.null&order=created_at.desc&limit=1`,
      );
      const tenantId = credentialRows[0]?.organization_id;
      if (!tenantId) throw new UnauthorizedException('Invalid or revoked machine credential');
      await this.machineCredentials.require(tenantId, machineId, machineCredential);
      req.user = { actorId: `machine:${machineId}`, tenantId, roles: ['operator'], authenticated: true };
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
