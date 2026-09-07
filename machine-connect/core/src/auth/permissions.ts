import { ForbiddenException } from '@nestjs/common';
import { Principal, PrincipalRole, requirePrincipal } from './principal';

export type Permission =
  | 'device.read'
  | 'device.control'
  | 'telemetry.read'
  | 'workflow.read'
  | 'workflow.execute'
  | 'security.read'
  | 'security.scan'
  | 'land.read'
  | 'land.transfer'
  | 'ai.read'
  | 'ai.run';

const ROLE_PERMISSIONS: Record<PrincipalRole, readonly Permission[] | '*'> = {
  owner: '*',
  admin: '*',
  operator: ['device.read', 'device.control', 'telemetry.read', 'workflow.read', 'workflow.execute'],
  viewer: ['device.read', 'telemetry.read', 'workflow.read'],
};

export function hasPermission(principal: Principal, permission: Permission): boolean {
  return principal.roles.some((role) => {
    const permissions = ROLE_PERMISSIONS[role];
    return permissions === '*' || permissions.includes(permission);
  });
}

export function requirePermission(principal: Principal | undefined, permission: Permission): Principal {
  const current = requirePrincipal(principal);
  if (!hasPermission(current, permission)) {
    throw new ForbiddenException(`Missing permission: ${permission}`);
  }
  return current;
}
