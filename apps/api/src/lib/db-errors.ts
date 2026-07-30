/**
 * Database error utilities.
 *
 * Translates low-level Drizzle/Postgres error codes into domain-level booleans.
 * Prevents raw database errors from leaking to the HTTP layer.
 */

/**
 * Returns true if the given error is a Postgres unique constraint violation
 * (error code 23505). Used by RegistrationService to translate DB errors
 * into ConflictError (409) instead of surfacing a 500.
 *
 * Compatible with errors thrown by Neon HTTP driver via drizzle-orm.
 */
export function isUniqueViolation(err: unknown): boolean {
  if (err === null || typeof err !== 'object') return false;

  // Drizzle wraps pg errors — the cause contains the original pg error
  const target = (err as Record<string, unknown>).cause ?? err;

  if (typeof target !== 'object' || target === null) return false;

  const code = (target as Record<string, unknown>).code;
  return code === '23505';
}
