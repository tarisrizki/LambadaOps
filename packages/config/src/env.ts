/**
 * Environment variable validation constants.
 *
 * These are technical constants used in env schema validation.
 * They are NOT business constants (not role slugs, not plan limits).
 *
 * Apps import these to validate their respective environment variables
 * using Zod in their own ConfigModule setup.
 *
 * Full Zod schemas are defined in each app's config module
 * (apps/api/src/config/ and apps/web/lib/env.ts) to keep app-specific
 * env vars co-located with the app that uses them.
 */

/**
 * Supported Node environments.
 */
export const NODE_ENVS = ['development', 'production', 'test'] as const;
export type NodeEnv = (typeof NODE_ENVS)[number];

/**
 * Default port for the NestJS backend.
 */
export const DEFAULT_API_PORT = 3000;

/**
 * Default JWT access token expiry.
 */
export const DEFAULT_JWT_EXPIRES_IN = '15m';

/**
 * Default JWT refresh token expiry.
 */
export const DEFAULT_JWT_REFRESH_EXPIRES_IN = '7d';

/**
 * Notification polling interval recommendation (milliseconds).
 * Frontend uses this as the setInterval duration.
 */
export const NOTIFICATION_POLL_INTERVAL_MS = 45_000; // 45 seconds (within 30-60s window)

/**
 * Maintenance reminder lookahead window (days).
 * Reminders are generated for schedules due within this many days.
 */
export const MAINTENANCE_REMINDER_DAYS_AHEAD = 7;

/**
 * Warranty expiry reminder lookahead window (days).
 */
export const WARRANTY_REMINDER_DAYS_AHEAD = 30;
