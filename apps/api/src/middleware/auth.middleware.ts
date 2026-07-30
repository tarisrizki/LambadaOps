import type { MiddlewareHandler } from 'hono';
import { verifyAccessToken } from '../lib/auth/jwt.js';
import type { AccessTokenClaims } from '../lib/auth/jwt.js';
import { UnauthorizedError, ForbiddenError } from '../lib/errors.js';
import { TenantContext } from '../lib/tenant-context.js';

export const authMiddleware: MiddlewareHandler<{ Variables: { user: AccessTokenClaims } }> = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or invalid Authorization header');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new UnauthorizedError('Malformed Authorization header');
  }
  
  try {
    // Exactly once: Verify and extract claims
    const claims = await verifyAccessToken(token);
    
    // Set user claims in Hono Context for route access if needed
    c.set('user', claims);

    // Initialize TenantContext, wrapping the remainder of the request execution
    await TenantContext.run({ tenantId: claims.tenantId }, async () => {
      await next();
    });
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
};

