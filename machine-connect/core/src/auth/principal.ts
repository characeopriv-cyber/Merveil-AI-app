export type PrincipalRole = 'owner' | 'admin' | 'operator' | 'viewer';

export interface Principal {
  actorId: string;
  tenantId: string;
  roles: PrincipalRole[];
  authenticated: boolean;
}

export function requirePrincipal(principal?: Principal): Principal {
  if (!principal?.authenticated || !principal.actorId || !principal.tenantId) {
    throw new Error('Authenticated principal required');
  }
  return principal;
}

export function requireRole(principal: Principal | undefined, ...allowed: PrincipalRole[]): Principal {
  const current = requirePrincipal(principal);
  if (!allowed.some((role) => current.roles.includes(role))) throw new Error('Insufficient role');
  return current;
}
