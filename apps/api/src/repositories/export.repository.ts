import { eq, and, desc } from 'drizzle-orm';
import { exportJobs } from '../db/schema/import-export.schema.js';
import { TenantRepository } from './base.repository.js';

export class ExportRepository extends TenantRepository {
  /**
   * Creates a new export job. tenantId is injected from TenantContext.
   */
  async createExportJob(data: Omit<typeof exportJobs.$inferInsert, 'tenantId' | 'id' | 'createdAt' | 'updatedAt'>) {
    const [job] = await this.db
      .insert(exportJobs)
      .values({ ...data, tenantId: this.tenantId })
      .returning();
    return job!;
  }

  /**
   * Retrieves an export job by ID, scoped to current tenant.
   */
  async getExportJobById(id: number) {
    const [job] = await this.db
      .select()
      .from(exportJobs)
      .where(
        and(
          eq(exportJobs.id, id),
          eq(exportJobs.tenantId, this.tenantId)
        )
      )
      .limit(1);
    return job ?? null;
  }

  /**
   * Updates an export job status / metadata.
   */
  async updateExportJob(id: number, data: Partial<Omit<typeof exportJobs.$inferInsert, 'id' | 'tenantId'>>) {
    const [job] = await this.db
      .update(exportJobs)
      .set(data)
      .where(
        and(
          eq(exportJobs.id, id),
          eq(exportJobs.tenantId, this.tenantId)
        )
      )
      .returning();
    return job ?? null;
  }

  /**
   * Gets the 20 most recent export jobs for the current tenant.
   */
  async getRecentExportJobs() {
    return this.db
      .select()
      .from(exportJobs)
      .where(eq(exportJobs.tenantId, this.tenantId))
      .orderBy(desc(exportJobs.createdAt))
      .limit(20);
  }

  /**
   * Exposes transaction to be used by services.
   */
  async transaction<T>(callback: (txRepo: this) => Promise<T>): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.db.transaction(async (tx: any) => {
      const txRepo = this.withTx(tx);
      return callback(txRepo);
    });
  }
}

export const exportRepository = new ExportRepository();
