import { db } from '../db/index.js';
import { importJobs, importErrors } from '../db/schema/import-export.schema.js';
import { eq } from 'drizzle-orm';

export const importRepository = {
  async createImportJob(data: typeof importJobs.$inferInsert) {
    const [job] = await db.insert(importJobs).values(data).returning();
    return job;
  },

  async updateImportJob(id: number, data: Partial<typeof importJobs.$inferInsert>) {
    const [job] = await db
      .update(importJobs)
      .set(data)
      .where(eq(importJobs.id, id))
      .returning();
    return job;
  },

  async getImportJob(id: number) {
    const [job] = await db
      .select()
      .from(importJobs)
      .where(eq(importJobs.id, id));
    return job;
  },

  async insertImportErrors(errors: (typeof importErrors.$inferInsert)[]) {
    if (errors.length === 0) return;
    await db.insert(importErrors).values(errors);
  },

  async getImportErrors(jobId: number) {
    return await db
      .select()
      .from(importErrors)
      .where(eq(importErrors.importJobId, jobId));
  },
};
