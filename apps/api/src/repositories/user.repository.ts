import { and, eq, count as countOp } from 'drizzle-orm';
import { users } from '../db/schema/user.schema.js';
import { GlobalRepository, TenantRepository } from './base.repository.js';

export type CreateUserInput = Omit<typeof users.$inferInsert, 'tenantId'>;
export type User = typeof users.$inferSelect;

// ─── GlobalUserRepository ─────────────────────────────────────────────────────

/**
 * Global (pre-auth) access to the `users` table.
 *
 * REPOSITORY CLASSIFICATION: GlobalRepository
 * Used by: UserInitializationService (registration), AuthService (login)
 * Does NOT require TenantContext.
 */
export class GlobalUserRepository extends GlobalRepository {
  /**
   * Finds a user by email across all tenants.
   * WARNING: Global lookup — only for auth/login layer (pre-TenantContext).
   */
  async findByEmailGlobal(email: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result[0] ?? null;
  }

  /**
   * Finds a user by email WITHIN a specific tenant.
   * Used by AuthService during login to enforce tenant isolation.
   * FEATURE_SPEC §1.2: email is unique per-tenant, not globally.
   */
  async findByEmailInTenant(email: string, tenantId: number): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(and(eq(users.email, email), eq(users.tenantId, tenantId)))
      .limit(1);

    return result[0] ?? null;
  }

  /**
   * Creates a new user with an explicit tenantId.
   * Used by UserInitializationService during registration (pre-TenantContext).
   */
  async createWithTenant(data: typeof users.$inferInsert): Promise<User> {
    const result = await this.db
      .insert(users)
      .values(data)
      .returning();

    return result[0]!;
  }

  /**
   * Hard-deletes a user by ID without tenant scope.
   *
   * @rollback-only — This method exists exclusively for the registration
   * compensating rollback path in RegistrationService.
   * MUST NOT be called from any other service, route, or context.
   */
  async deleteById(id: number): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }
}

export const globalUserRepository = new GlobalUserRepository();

// ─── UserRepository ───────────────────────────────────────────────────────────

/**
 * Tenant-scoped (post-auth) access to the `users` table.
 * All methods enforce tenant isolation via TenantContext.
 */
export class UserRepository extends TenantRepository {
  /**
   * Finds a user by ID within the current tenant.
   * Enforces tenant isolation.
   */
  async findById(id: number): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(and(eq(users.tenantId, this.tenantId), eq(users.id, id)))
      .limit(1);

    return result[0] ?? null;
  }

  /**
   * Creates a new user for the current tenant.
   * The tenantId is automatically injected from TenantContext.
   */
  async create(data: CreateUserInput): Promise<User> {
    const result = await this.db
      .insert(users)
      .values({
        ...data,
        tenantId: this.tenantId,
      })
      .returning();

    return result[0]!;
  }

  /**
   * Lists all users in the current tenant.
   * Enforces tenant isolation.
   */
  async findAll(): Promise<User[]> {
    return this.db
      .select()
      .from(users)
      .where(eq(users.tenantId, this.tenantId));
  }

  /**
   * Returns the total number of users in the current tenant.
   * Enforces tenant isolation.
   */
  async count(): Promise<number> {
    const result = await this.db
      .select({ count: countOp() })
      .from(users)
      .where(eq(users.tenantId, this.tenantId));
    
    return result[0]?.count ?? 0;
  }

  /**
   * Finds all users with a specific role in the current tenant.
   */
  async findByRole(roleId: number): Promise<User[]> {
    return this.db
      .select()
      .from(users)
      .where(and(eq(users.tenantId, this.tenantId), eq(users.roleId, roleId)));
  }
}

export const userRepository = new UserRepository();
