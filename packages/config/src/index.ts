/**
 * @lambadaops/config
 *
 * Shared TECHNICAL configuration for LambadaOps.
 * Consumed by apps/api (NestJS) and apps/web (Next.js).
 *
 * Scope — ONLY technical configuration:
 *   - Environment variable validation schemas (Zod)
 *   - Runtime config helpers
 *   - Shared technical constants (timeouts, limits that are infrastructure concerns)
 *
 * NOT in scope:
 *   - Role slugs (domain data — source of truth: database roles table)
 *   - Plan limits (domain data — source of truth: database plans table)
 *   - Any business logic or rules
 */

// ─── Re-exports (populated per Phase) ────────────────────────────────────────

export * from './env';
