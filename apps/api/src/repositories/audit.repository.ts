import { auditLogs } from '../db/schema/audit.schema.js';
import { TenantRepository } from './base.repository.js';

export type CreateAuditLogParams = typeof auditLogs.$inferInsert;

export class AuditRepository extends TenantRepository {
  /**
   * Only INSERT is allowed for Audit logs.
   * Modifying or deleting audit logs is strictly prohibited. SPEC §9.2.
   */
  async create(data: CreateAuditLogParams): Promise<typeof auditLogs.$inferSelect> {
    const [auditLog] = await this.db.insert(auditLogs).values(data).returning();
    return auditLog!;
  }
}

export const auditRepository = new AuditRepository();
