import { eq } from 'drizzle-orm';
import { tenants } from '../db/schema/tenant.schema.js';
import { GlobalRepository } from './base.repository.js';

export type CreateTenantInput = typeof tenants.$inferInsert;
export type Tenant = typeof tenants.$inferSelect;

export class TenantRepository extends GlobalRepository {
  /**
   * Finds a tenant by ID.
   * This is a global query (no tenant isolation required).
   */
  async findById(id: number) {
    const result = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id))
      .limit(1);
    
    return result[0] ?? null;
  }

  /**
   * Finds all active tenants.
   */
  async findAllActiveTenants() {
    return this.db
      .select()
      .from(tenants)
      .where(eq(tenants.status, 'active'));
  }

  /**
   * Finds a tenant by slug.
   * Used at registration and login to resolve tenant from company_slug.
   * WARNING: Global lookup — operates without TenantContext.
   */
  async findBySlug(slug: string): Promise<Tenant | null> {
    const result = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);

    return result[0] ?? null;
  }

  /**
   * Creates a new tenant.
   */
  async create(data: CreateTenantInput) {
    const result = await this.db
      .insert(tenants)
      .values(data)
      .returning();
    return result[0]!;
  }

  /**
   * Hard-deletes a tenant by ID.
   *
   * @rollback-only — This method exists exclusively for the registration
   * compensating rollback path in RegistrationService.
   * MUST NOT be called from any other service, route, or context.
   */
  async deleteById(id: number): Promise<void> {
    await this.db.delete(tenants).where(eq(tenants.id, id));
  }
}

export const tenantRepository = new TenantRepository();
