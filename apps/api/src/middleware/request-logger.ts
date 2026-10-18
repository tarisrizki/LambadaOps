import type { Context, Next } from 'hono';
import { logger } from '../lib/logger.js';

/**
 * Request logging middleware with correlation ID support.
 *
 * - Generates or propagates a `correlationId` for every request.
 * - Logs the method, path, status code, duration, and client IP.
 * - The correlation ID is stored in `c.set('correlationId')` so downstream
 *   handlers and error handlers can include it in their own log entries.
 *
 * The correlation ID can be propagated by the client via the
 * `X-Correlation-Id` header. If absent, a new UUID is generated.
 */
export const requestLogger = async (c: Context, next: Next) => {
  const correlationId =
    c.req.header('X-Correlation-Id') || crypto.randomUUID();

  c.set('correlationId', correlationId);

  const startTime = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  // Log the incoming request
  logger.info(
    {
      correlationId,
      method,
      path,
      ip: getClientIp(c),
    },
    'incoming request'
  );

  await next();

  const duration = Date.now() - startTime;
  const statusCode = c.res?.status || 200;

  // Log the response
  if (statusCode >= 400) {
    logger.warn(
      {
        correlationId,
        method,
        path,
        statusCode,
        durationMs: duration,
      },
      'request completed (error)'
    );
  } else {
    logger.info(
      {
        correlationId,
        method,
        path,
        statusCode,
        durationMs: duration,
      },
      'request completed'
    );
  }
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
  return c.env!.remoteAddress ?? 'unknown';
}
