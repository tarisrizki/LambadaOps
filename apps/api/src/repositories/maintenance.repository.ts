import { eq, and, desc, isNull, inArray } from 'drizzle-orm';
import { 
  maintenanceJobs, 
  maintenanceTasks, 
  maintenanceParts, 
  maintenanceNotes,
  maintenanceAttachments 
} from '../db/schema/maintenance.schema.js';
import { TenantRepository } from './base.repository.js';
import { db } from '../db/index.js';

export class MaintenanceRepository extends TenantRepository {
  // --- Maintenance Jobs ---

  async createJob(data: Omit<typeof maintenanceJobs.$inferInsert, 'tenantId'>): Promise<typeof maintenanceJobs.$inferSelect> {
    const dbClient = this.txSession || db;
    const [job] = await dbClient
      .insert(maintenanceJobs)
      .values({ ...data, tenantId: this.tenantId })
      .returning();
    return job!;
  }

  async findJobById(id: number): Promise<typeof maintenanceJobs.$inferSelect | undefined> {
    const dbClient = this.txSession || db;
    const [job] = await dbClient
      .select()
      .from(maintenanceJobs)
      .where(and(eq(maintenanceJobs.id, id), eq(maintenanceJobs.tenantId, this.tenantId)))
      .limit(1);
    return job;
  }

  async findJobsByAsset(assetId: number): Promise<(typeof maintenanceJobs.$inferSelect)[]> {
    const dbClient = this.txSession || db;
    return dbClient
      .select()
      .from(maintenanceJobs)
      .where(and(eq(maintenanceJobs.assetId, assetId), eq(maintenanceJobs.tenantId, this.tenantId)))
      .orderBy(desc(maintenanceJobs.createdAt));
  }

  async findScheduledJobs(): Promise<(typeof maintenanceJobs.$inferSelect)[]> {
    const dbClient = this.txSession || db;
    return dbClient
      .select()
      .from(maintenanceJobs)
      .where(and(eq(maintenanceJobs.tenantId, this.tenantId), eq(maintenanceJobs.status, 'scheduled')));
  }

  async updateJobWithVersion(
    id: number,
    currentVersion: number,
    data: Partial<Omit<typeof maintenanceJobs.$inferInsert, 'id' | 'tenantId' | 'version'>>
  ): Promise<typeof maintenanceJobs.$inferSelect | undefined> {
    const dbClient = this.txSession || db;
    const [updatedJob] = await dbClient
      .update(maintenanceJobs)
      .set({
        ...data,
        version: currentVersion + 1,
      })
      .where(
        and(
          eq(maintenanceJobs.id, id),
          eq(maintenanceJobs.tenantId, this.tenantId),
          eq(maintenanceJobs.version, currentVersion)
        )
      )
      .returning();
    return updatedJob;
  }

  // --- Maintenance Tasks ---

  async createTask(data: Omit<typeof maintenanceTasks.$inferInsert, 'id' | 'createdAt'>): Promise<typeof maintenanceTasks.$inferSelect> {
    const dbClient = this.txSession || db;
    const [task] = await dbClient
      .insert(maintenanceTasks)
      .values(data)
      .returning();
    return task!;
  }

  async completeTask(taskId: number, jobId: number, completedBy: number): Promise<typeof maintenanceTasks.$inferSelect | undefined> {
    const dbClient = this.txSession || db;
    const [updatedTask] = await dbClient
      .update(maintenanceTasks)
      .set({
        isCompleted: true,
        completedBy,
        completedAt: new Date(),
      })
      .where(
        and(
          eq(maintenanceTasks.id, taskId),
          eq(maintenanceTasks.maintenanceJobId, jobId)
        )
      )
      .returning();
    return updatedTask;
  }

  // --- Maintenance Parts ---

  async addPart(data: Omit<typeof maintenanceParts.$inferInsert, 'id' | 'createdAt' | 'totalCost'>): Promise<typeof maintenanceParts.$inferSelect> {
    const dbClient = this.txSession || db;
    
    // Convert strings to number for calculation, ensuring precision
    const qty = data.quantity ?? 1;
    const unitCost = Number(data.unitCost || 0);
    const totalCost = (qty * unitCost).toFixed(2);

    const [part] = await dbClient
      .insert(maintenanceParts)
      .values({ ...data, totalCost })
      .returning();
    return part!;
  }

  async getPartsByJob(jobId: number): Promise<(typeof maintenanceParts.$inferSelect)[]> {
    const dbClient = this.txSession || db;
    return dbClient
      .select()
      .from(maintenanceParts)
      .where(eq(maintenanceParts.maintenanceJobId, jobId))
      .orderBy(desc(maintenanceParts.createdAt));
  }

  // --- Maintenance Notes ---

  async addNote(data: Omit<typeof maintenanceNotes.$inferInsert, 'id' | 'createdAt'>): Promise<typeof maintenanceNotes.$inferSelect> {
    const dbClient = this.txSession || db;
    const [note] = await dbClient
      .insert(maintenanceNotes)
      .values(data)
      .returning();
    return note!;
  }

  async getNotesByJob(jobId: number): Promise<(typeof maintenanceNotes.$inferSelect)[]> {
    const dbClient = this.txSession || db;
    return dbClient
      .select()
      .from(maintenanceNotes)
      .where(eq(maintenanceNotes.maintenanceJobId, jobId))
      .orderBy(desc(maintenanceNotes.createdAt));
  }

  // --- Maintenance Attachments ---

  async linkAttachment(jobId: number, attachmentId: number): Promise<void> {
    const dbClient = this.txSession || db;
    await dbClient
      .insert(maintenanceAttachments)
      .values({ maintenanceJobId: jobId, attachmentId })
      .onConflictDoNothing(); // ignore duplicates
  }
  
  /**
   * Exposes transaction to be used by services
   */
  async transaction<T>(callback: (txRepo: this) => Promise<T>): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return db.transaction(async (tx: any) => {
      const txRepo = this.withTx(tx);
      return callback(txRepo);
    });
  }
}

export const maintenanceRepository = new MaintenanceRepository();
