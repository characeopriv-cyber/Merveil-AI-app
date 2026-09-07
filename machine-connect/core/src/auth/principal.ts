import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

export type PrincipalRole = 'owner' | 'admin' | 'operator' | 'viewer';

export interface Principal {
  actorId: string;
  tenantId: string;
  roles: PrincipalRole[];
}

export function requirePrincipal(principal?: Principal): Principal {
  if (!principal?.actorId || !principal.tenantId || !principal.roles?.length) {
    throw new UnauthorizedException('Authenticated principal required');
  }
  return principal;
}

export function requireRole(principal: Principal | undefined, ...allowed: PrincipalRole[]): Principal {
  const current = requirePrincipal(principal);
  if (!allowed.some((role) => current.roles.includes(role))) {
    throw new ForbiddenException('Insufficient role');
  }
  return current;
}
