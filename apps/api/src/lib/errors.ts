import { HTTPException } from 'hono/http-exception';

// ─── Re-export HTTPException for consistent usage ─────────────────────────────
// All route handlers and middleware should throw HTTPException, not raw Error.
// This ensures the app.onError() handler can produce the correct HTTP response.
export { HTTPException };

// ─── Typed Error Classes ──────────────────────────────────────────────────────

/**
 * 400 — Invalid input that passed route-level Zod validation but failed
 * domain-level business rule validation.
 *
 * Example: creating a user with an email that already exists in the tenant.
 */
export class ValidationError extends HTTPException {
  constructor(message: string) {
    super(400, { message });
  }
}

/**
 * 401 — The request is not authenticated or the token is invalid/expired.
 */
export class UnauthorizedError extends HTTPException {
  constructor(message = 'Unauthorized') {
    super(401, { message });
  }
}

/**
 * 401 — Specific to login failures.
 */
export class InvalidCredentialsError extends HTTPException {
  constructor(message = 'Invalid email or password') {
    super(401, { message });
  }
}

/**
 * 403 — The authenticated user does not have permission to perform this action.
 */
export class ForbiddenError extends HTTPException {
  constructor(message = 'Forbidden') {
    super(403, { message });
  }
}

/**
 * 404 — The requested resource does not exist within the current tenant scope.
 *
 * NOTE: Also used for cross-tenant access attempts — return 404 (not 403) to
 * avoid leaking information about resources that exist in other tenants.
 * See FEATURE_SPEC.md § security notes.
 */
export class NotFoundError extends HTTPException {
  constructor(resource = 'Resource') {
    super(404, { message: `${resource} not found` });
  }
}

/**
 * 409 — Conflict. Used for optimistic locking violations and duplicate entries.
 *
 * Example: version mismatch on asset update.
 */
export class ConflictError extends HTTPException {
  constructor(message: string) {
    super(409, { message });
  }
}

/**
 * 422 — Business rule violation that is not a simple validation error.
 *
 * Example: tenant has reached the asset limit for their subscription plan.
 */
export class BusinessRuleError extends HTTPException {
  constructor(message: string) {
    super(422, { message });
  }
}

/**
 * 409 — A subscription already exists for this tenant.
 *
 * Thrown when attempting to create a trialing subscription for a tenant
 * that already has an active or trialing subscription.
 */
export class SubscriptionConflictError extends HTTPException {
  constructor(message = 'Tenant already has an active subscription') {
    super(409, { message });
  }
}

/**
 * 403 — Plan Limit Exceeded.
 * 
 * Thrown when attempting to create a user or asset that would exceed
 * the tenant's current subscription limits.
 */
export class PlanLimitError extends HTTPException {
  constructor(message: string) {
    super(403, { message });
  }
}
