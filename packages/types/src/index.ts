/**
 * @lambadaops/types
 *
 * Shared TypeScript type definitions for LambadaOps.
 * Consumed by both apps/api (NestJS) and apps/web (Next.js).
 *
 * Structure (to be populated as features are built):
 *   - API response shapes
 *   - DTO interfaces (mirroring backend DTOs)
 *   - Enum values shared across apps
 *   - Common utility types
 *
 * Rules:
 *   - No runtime code — types only
 *   - No imports from apps/api or apps/web
 *   - No business logic
 */

// ─── Placeholder exports — filled in per Phase ───────────────────────────────

/**
 * Standard API response envelope.
 * All NestJS endpoints return this shape.
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/**
 * Standard paginated response envelope.
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Standard API error response.
 */
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
