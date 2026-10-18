import pino from 'pino';

/**
 * Structured logger (pino).
 *
 * Uses `process.env.NODE_ENV` directly (not getEnv()) to avoid a circular
 * dependency: `env.ts` imports this module for warn-level fallback logging.
 */
const isDev = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  transport: isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});
