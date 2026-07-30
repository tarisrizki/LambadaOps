import { eq, and, sql, isNull, ilike, desc } from 'drizzle-orm';
import { assets, assetEvents, assetAssignments, assetCategories, locations } from '../db/schema/asset.schema.js';
import { TenantRepository } from './base.repository.js';

export class AssetRepository extends TenantRepository {
  /**
   * Creates a new asset record.
   */
  async create(data: Omit<typeof assets.$inferInsert, 'tenantId'>): Promise<typeof assets.$inferSelect> {
    const [asset] = await this.db
      .insert(assets)
      .values({
        ...data,
        tenantId: this.tenantId,
      })
      .returning();
    return asset!;
  }

  /**
   * Finds an asset by ID within the current tenant context.
   * By default, ignores soft-deleted records unless explicitly requested.
   */
  async findById(id: number, includeDeleted = false): Promise<typeof assets.$inferSelect | undefined> {
    const filters = [eq(assets.id, id), eq(assets.tenantId, this.tenantId)];
    if (!includeDeleted) {
      filters.push(isNull(assets.deletedAt));
    }

    const [asset] = await this.db
      .select()
      .from(assets)
      .where(and(...filters))
      .limit(1);

    return asset;
  }

  /**
   * Updates an asset using Optimistic Locking.
   * Requires matching id and version.
   * 
   * Returns the updated asset if successful, or undefined if the row was not found
   * (which implies either a concurrent modification or the asset doesn't exist).
   */
  async updateWithVersion(
    id: number,
    currentVersion: number,
    data: Partial<Omit<typeof assets.$inferInsert, 'id' | 'tenantId' | 'version'>>
  ): Promise<typeof assets.$inferSelect | undefined> {
    const [updatedAsset] = await this.db
      .update(assets)
      .set({
        ...data,
        version: currentVersion + 1,
      })
      .where(
        and(
          eq(assets.id, id),
          eq(assets.tenantId, this.tenantId),
          eq(assets.version, currentVersion),
          isNull(assets.deletedAt)
        )
      )
      .returning();

    return updatedAsset;
  }

  /**
   * Soft deletes an asset by setting deletedAt to now and updating its status.
   */
  async softDelete(id: number, currentVersion: number): Promise<typeof assets.$inferSelect | undefined> {
    const [deletedAsset] = await this.db
      .update(assets)
      .set({
        deletedAt: new Date(),
        status: 'retired',
        version: currentVersion + 1,
      })
      .where(
        and(
          eq(assets.id, id),
          eq(assets.tenantId, this.tenantId),
          eq(assets.version, currentVersion),
          isNull(assets.deletedAt)
        )
      )
      .returning();

    return deletedAsset;
  }

  /**
   * Counts the number of active assets for the current tenant.
   */
  async count(): Promise<number> {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(assets)
      .where(and(eq(assets.tenantId, this.tenantId), isNull(assets.deletedAt)));
    
    return Number(result?.count ?? 0);
  }

  /**
   * Lists assets for a tenant with optional search.
   */
  async findAll(search?: string): Promise<(typeof assets.$inferSelect)[]> {
    const filters = [eq(assets.tenantId, this.tenantId), isNull(assets.deletedAt)];
    
    if (search) {
      filters.push(ilike(assets.name, `%${search}%`));
    }

    return this.db
      .select()
      .from(assets)
      .where(and(...filters))
      .orderBy(desc(assets.createdAt));
  }

  /**
   * Search for assets by multiple criteria (status, location, department)
   */
  async search(filters: { status?: string; locationId?: number; departmentId?: number }): Promise<{ data: (typeof assets.$inferSelect)[] }> {
    const conditions = [eq(assets.tenantId, this.tenantId), isNull(assets.deletedAt)];
    
    if (filters.status) conditions.push(eq(assets.status, filters.status as any));
    if (filters.locationId) conditions.push(eq(assets.locationId, filters.locationId));
    if (filters.departmentId) conditions.push(eq(assets.departmentId, filters.departmentId));

    const data = await this.db
      .select()
      .from(assets)
      .where(and(...conditions));
    return { data };
  }

  /**
   * Find an asset by its unique QR code token.
   */
  async findByQrCode(qrCodeToken: string): Promise<typeof assets.$inferSelect | undefined> {
    const [asset] = await this.db
      .select()
      .from(assets)
      .where(
        and(
          eq(assets.qrCodeToken, qrCodeToken),
          eq(assets.tenantId, this.tenantId),
          isNull(assets.deletedAt)
        )
      )
      .limit(1);
    return asset;
  }


  /**
   * Retrieves the currently active assignment for a given asset.
   */
  async getActiveAssignment(assetId: number): Promise<typeof assetAssignments.$inferSelect | undefined> {
    const [assignment] = await this.db
      .select()
      .from(assetAssignments)
      .where(
        and(
          eq(assetAssignments.tenantId, this.tenantId),
          eq(assetAssignments.assetId, assetId),
          isNull(assetAssignments.returnedAt)
        )
      )
      .limit(1);

    return assignment;
  }

  /**
   * Inserts a new immutable asset assignment record.
   */
  async insertAssignment(data: Omit<typeof assetAssignments.$inferInsert, 'tenantId'>): Promise<typeof assetAssignments.$inferSelect> {
    const [assignment] = await this.db
      .insert(assetAssignments)
      .values({
        ...data,
        tenantId: this.tenantId,
      })
      .returning();

    return assignment!;
  }

  /**
   * Closes an active assignment by setting returnedAt.
   * This is the ONLY time an assignment record is updated.
   */
  async closeAssignment(assignmentId: number): Promise<void> {
    await this.db
      .update(assetAssignments)
      .set({ returnedAt: new Date() })
      .where(
        and(
          eq(assetAssignments.id, assignmentId),
          eq(assetAssignments.tenantId, this.tenantId),
          isNull(assetAssignments.returnedAt)
        )
      );
  }

  /**
   * Retrieves the full assignment history for an asset, ordered by most recent first.
   */
  async getAssignmentHistory(assetId: number): Promise<(typeof assetAssignments.$inferSelect)[]> {
    return this.db
      .select()
      .from(assetAssignments)
      .where(
        and(
          eq(assetAssignments.tenantId, this.tenantId),
          eq(assetAssignments.assetId, assetId)
        )
      )
      .orderBy(desc(assetAssignments.assignedAt));
  }

  /**
   * Exposes transaction to be used by services
   */
  async transaction<T>(callback: (txRepo: this) => Promise<T>): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.db.transaction(async (tx: any) => {
      const txRepo = this.withTx(tx);
      return callback(txRepo);
    });
  }
  /**
   * Retrieves all categories for the tenant.
   */
  async getCategories() {
    return this.db
      .select()
      .from(assetCategories)
      .where(eq(assetCategories.tenantId, this.tenantId));
  }

  /**
   * Retrieves all locations for the tenant.
   */
  async getLocations() {
    return this.db
      .select()
      .from(locations)
      .where(eq(locations.tenantId, this.tenantId));
  }

  /**
   * Finds an asset by asset code for the tenant.
   */
  async findByCode(assetCode: string) {
    const [asset] = await this.db
      .select()
      .from(assets)
      .where(
        and(
          eq(assets.assetCode, assetCode),
          eq(assets.tenantId, this.tenantId),
          isNull(assets.deletedAt)
        )
      )
      .limit(1);
    return asset;
  }

  /**
   * Finds assets with warranty expiring within a specific date range.
   */
  async findExpiringWarranties(startDate: Date, endDate: Date) {
    // We can use raw SQL or drizzle helpers. Since dates are stored as strings (YYYY-MM-DD) in SQLite/Drizzle PG Date,
    // we format them or just compare as strings.
    const startStr = startDate.toISOString().split('T')[0]!;
    const endStr = endDate.toISOString().split('T')[0]!;
    
    return this.db
      .select()
      .from(assets)
      .where(
        and(
          eq(assets.tenantId, this.tenantId),
          isNull(assets.deletedAt),
          sql`${assets.warrantyEnd} >= ${startStr}`,
          sql`${assets.warrantyEnd} <= ${endStr}`
        )
      );
  }
}

export const assetRepository = new AssetRepository();
