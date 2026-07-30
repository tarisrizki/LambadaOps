import { AsyncLocalStorage } from 'node:async_hooks';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TenantContext {
  /** ID of the current tenant (bigint mapped to JS number). */
  tenantId: number;
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const storage = new AsyncLocalStorage<TenantContext>();

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Retrieve the current tenant context.
 *
 * THROWS if called outside of an active request context (i.e., no `run()` in
 * the call stack). This is intentional: any code that touches tenant-scoped
 * data must be called within a request, never in a standalone background
 * context without explicit setup.
 *
 * For Inngest functions, call `TenantContext.set()` at the start of each
 * function before any repository access.
 */
export const TenantContext = {
  /**
   * Run `fn` with the provided tenant context bound to the current async scope.
   * All code within `fn` (including awaited calls) will see this context.
   */
  run<T>(ctx: TenantContext, fn: () => Promise<T>): Promise<T> {
    return storage.run(ctx, fn);
  },

  /**
   * Get the current tenant context.
   * Throws if not inside a `run()` scope.
   */
  get(): TenantContext {
    const ctx = storage.getStore();
    if (!ctx) {
      throw new Error(
        '[TenantContext] No tenant context found in the current async scope. ' +
          'Ensure this code runs inside a request handler that calls TenantContext.run(), ' +
          'or set the context explicitly at the start of an Inngest function.',
      );
    }
    return ctx;
  },

  /**
   * Convenience getter for tenantId — equivalent to `TenantContext.get().tenantId`.
   * Throws if not inside a `run()` scope.
   */
  getTenantId(): number {
    return TenantContext.get().tenantId;
  },
};
