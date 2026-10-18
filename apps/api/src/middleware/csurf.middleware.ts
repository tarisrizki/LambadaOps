import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { COOKIE_NAMES } from '../lib/auth/cookies.js';
import { logger } from '../lib/logger.js';

/**
 * Paths exempt from CSRF protection.
 * These use SameSite=Strict httpOnly cookies which already provide CSRF
 * protection, or are pre-session endpoints that don't have a CSRF token yet.
 */
const CSRF_EXEMPT_PATHS = ['/api/auth/login', '/api/auth/refresh'];

/**
 * CSRF protection using the **double-submit cookie** pattern.
 *
 * Flow:
 *  1. On login, the server sets an httpOnly `csrf_token` cookie AND returns
 *     the token value in the JSON response body (`csrfToken`).
 *  2. The client stores the value in memory (or a React context) and echoes
 *     it back in the `X-CSRF-Token` header on every state-changing request
 *     (POST / PUT / PATCH / DELETE).
 *  3. This middleware compares the `csrf_token` cookie value with the
 *     `X-CSRF-Token` header value. They must match.
 *
 * Why this works against CSRF:
 *  - An attacker on a different origin cannot read the `csrf_token` cookie
 *    (browsers do not leak httpOnly cookies cross-origin).
 *  - An attacker cannot set the `X-CSRF-Token` header to match because
 *    they don't know the cookie value (same-origin policy + CORS).
 *  - The cookie value and header value must match, proving the request
 *    originated from a context that has access to both.
 *
 * NOTE: This middleware should be applied AFTER CORS and request logging,
 * but BEFORE route handlers. It only validates on state-changing methods
 * (POST, PUT, PATCH, DELETE). GET, HEAD, OPTIONS are exempt.
 */
export const csrfProtection = async (c: Context, next: Next) => {
  const method = c.req.method;
  const path = c.req.path;

  // GET, HEAD, OPTIONS are safe methods — no CSRF protection needed.
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next();
  }

  // Auth endpoints that establish or renew sessions are exempt:
  //  - /auth/login: no CSRF cookie exists yet (pre-session).
  //  - /auth/refresh: uses SameSite=Strict httpOnly refresh_token cookie.
  if (CSRF_EXEMPT_PATHS.some((exempt) => path.startsWith(exempt))) {
    return next();
  }

  const cookieToken = getCookie(c, COOKIE_NAMES.CSRF_TOKEN);
  const headerToken = c.req.header('X-CSRF-Token');

  // If there's no CSRF cookie at all, skip validation.
  // This allows unauthenticated endpoints without a prior login to function.
  if (!cookieToken) {
    return next();
  }

  if (!headerToken || cookieToken !== headerToken) {
    logger.warn(
      {
        correlationId: c.get('correlationId'),
        path,
        method,
        ip: getClientIp(c),
        reason: 'csrf_token mismatch',
      },
      'CSRF validation failed'
    );

    return c.json({ message: 'CSRF token mismatch' }, 403);
  }

  return next();
};

/**
 * Extracts the client IP address from the request, respecting
 * X-Forwarded-For when behind a proxy.
 */
function getClientIp(c: Context): string {
  const xForwardedFor = c.req.header('X-Forwarded-For');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0]!.trim();
  }
  const xRealIp = c.req.header('X-Real-IP');
  if (xRealIp) {
    return xRealIp.trim();
  }
  return 'unknown';
}
