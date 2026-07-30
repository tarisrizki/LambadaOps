import type { MiddlewareHandler } from 'hono';
import type { AccessTokenClaims } from '../lib/auth/jwt.js';
import type { SystemRole } from '../lib/auth/roles.js';
import { ForbiddenError, UnauthorizedError } from '../lib/errors.js';

type UserContext = { Variables: { user: AccessTokenClaims } };

/**
 * Ensures the authenticated user has the exact specified role.
 * Assumes auth.middleware has already populated `c.get('user')`.
 */
export const requireRole = (requiredRole: SystemRole): MiddlewareHandler<UserContext> => {
  return async (c, next) => {
    const user = c.get('user');

    if (!user) {
      throw new UnauthorizedError('User context not found. Ensure auth middleware runs first.');
    }

    if (user.roleId !== requiredRole) {
      throw new ForbiddenError(`Role ${requiredRole} is required to access this resource.`);
    }

    await next();
  };
};

/**
 * Ensures the authenticated user has any of the specified roles.
 * Assumes auth.middleware has already populated `c.get('user')`.
 */
export const requireAnyRole = (allowedRoles: SystemRole[]): MiddlewareHandler<UserContext> => {
  return async (c, next) => {
    const user = c.get('user');

    if (!user) {
      throw new UnauthorizedError('User context not found. Ensure auth middleware runs first.');
    }

    if (!allowedRoles.includes(user.roleId as SystemRole)) {
      throw new ForbiddenError('You do not have permission to access this resource.');
    }

    await next();
  };
};
