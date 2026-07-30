import { db } from '../db/index.js';
import { TenantContext } from '../lib/tenant-context.js';

/**
 * Base repository for global tables (e.g., tenants, roles, plans)
 * that are not scoped to a specific tenant.
 */
export abstract class GlobalRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected _tx?: any;

  /**
   * Protected access to the Drizzle database client.
   * Uses transaction if _tx is set.
   */
  protected get db() {
    return this._tx ?? db;
  }

  /**
   * Public access to the underlying transaction session.
   * Useful when sharing transactions between different repositories.
   */
  get txSession() {
    return this._tx;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  withTx<T extends GlobalRepository>(this: T, tx: any): T {
    const clone = Object.create(Object.getPrototypeOf(this));
    Object.assign(clone, this);
    clone._tx = tx;
    return clone;
  }
}

/**
 * Base repository for tenant-scoped tables (e.g., users, assets).
 * Enforces tenant isolation by requiring `this.tenantId` for all queries.
 */
export abstract class TenantRepository {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected _tx?: any;

  /**
   * Protected access to the Drizzle database client.
   * Uses transaction if _tx is set.
   */
  protected get db() {
    return this._tx ?? db;
  }

  /**
   * Public access to the underlying transaction session.
   * Useful when sharing transactions between different repositories.
   */
  get txSession() {
    return this._tx;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  withTx<T extends TenantRepository>(this: T, tx: any): T {
    const clone = Object.create(Object.getPrototypeOf(this));
    Object.assign(clone, this);
    clone._tx = tx;
    return clone;
  }

  /**
   * Retrieves the current tenant ID from the AsyncLocalStorage context.
   * THROWS if called outside of a request context.
   * All repository methods MUST use `this.tenantId` in their WHERE clauses.
   */
  protected get tenantId(): number {
    return TenantContext.getTenantId();
  }
}
