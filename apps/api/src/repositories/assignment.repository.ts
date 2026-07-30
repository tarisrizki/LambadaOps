import { eq, and, desc, ilike, or } from 'drizzle-orm';
import { assetAssignments, assets, departments } from '../db/schema/asset.schema.js';
import { users } from '../db/schema/user.schema.js';
import { TenantRepository } from './base.repository.js';

export class AssignmentRepository extends TenantRepository {
  /**
   * Retrieves all assignments for the current tenant.
   * Includes relations (Asset, User, Department).
   */
  async list(search?: string) {
    const conditions = [eq(assetAssignments.tenantId, this.tenantId)];

    if (search) {
      conditions.push(
        or(
          ilike(assets.name, `%${search}%`),
          ilike(assets.assetCode, `%${search}%`)
        )!
      );
    }

    const data = await this.db
      .select({
        assignment: assetAssignments,
        asset: {
          id: assets.id,
          name: assets.name,
          assetCode: assets.assetCode,
        },
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        department: {
          id: departments.id,
          name: departments.name,
        },
        createdBy: {
          id: users.id,
          name: users.name,
        }
      })
      .from(assetAssignments)
      .innerJoin(assets, eq(assetAssignments.assetId, assets.id))
      .leftJoin(users, eq(assetAssignments.userId, users.id))
      .leftJoin(departments, eq(assetAssignments.departmentId, departments.id))
      .where(and(...conditions))
      .orderBy(desc(assetAssignments.assignedAt));

    return { data };
  }

  async findById(id: number) {
    const records = await this.db
      .select({
        assignment: assetAssignments,
        asset: {
          id: assets.id,
          name: assets.name,
          assetCode: assets.assetCode,
        },
        user: {
          id: users.id,
          name: users.name,
        },
        department: {
          id: departments.id,
          name: departments.name,
        },
      })
      .from(assetAssignments)
      .innerJoin(assets, eq(assetAssignments.assetId, assets.id))
      .leftJoin(users, eq(assetAssignments.userId, users.id))
      .leftJoin(departments, eq(assetAssignments.departmentId, departments.id))
      .where(and(eq(assetAssignments.id, id), eq(assetAssignments.tenantId, this.tenantId)))
      .limit(1);

    return records[0] || null;
  }

  async update(id: number, data: Partial<typeof assetAssignments.$inferInsert>) {
    const [updated] = await this.db
      .update(assetAssignments)
      .set(data)
      .where(and(eq(assetAssignments.id, id), eq(assetAssignments.tenantId, this.tenantId)))
      .returning();

    return updated || null;
  }

  async delete(id: number) {
    const [deleted] = await this.db
      .delete(assetAssignments)
      .where(and(eq(assetAssignments.id, id), eq(assetAssignments.tenantId, this.tenantId)))
      .returning();

    return deleted || null;
  }

  /**
   * Exposes transaction to be used by services
   */
  async transaction<T>(callback: (txRepo: this) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx: unknown) => {
      const txRepo = this.withTx(tx);
      return callback(txRepo);
    });
  }
}

export const assignmentRepository = new AssignmentRepository();
