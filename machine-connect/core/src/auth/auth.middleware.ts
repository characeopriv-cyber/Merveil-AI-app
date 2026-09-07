import { Injectable, NestMiddleware, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrincipalRole } from './principal';

type RequestLike = { headers: Record<string, string | string[] | undefined>; user?: { actorId: string; tenantId: string; roles: PrincipalRole[]; authenticated: true } };

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  async use(req: RequestLike, _res: unknown, next: () => void) {
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
    membershipUrl.searchParams.set('select', 'role');
    membershipUrl.searchParams.set('organization_id', `eq.${tenantId}`);
    membershipUrl.searchParams.set('user_id', `eq.${user.id}`);
    membershipUrl.searchParams.set('limit', '1');
    const membershipResponse = await fetch(membershipUrl, { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } });
    if (!membershipResponse.ok) throw new ForbiddenException('Organization membership could not be verified');
    const memberships = await membershipResponse.json() as Array<{ role?: string }>;
    if (!memberships.length) throw new ForbiddenException('User is not a member of this organization');

    const allowed: PrincipalRole[] = ['owner', 'admin', 'operator', 'viewer'];
    const role = allowed.includes(memberships[0].role as PrincipalRole) ? memberships[0].role as PrincipalRole : 'viewer';
    req.user = { actorId: user.id, tenantId, roles: [role], authenticated: true };
    next();
  }
}
