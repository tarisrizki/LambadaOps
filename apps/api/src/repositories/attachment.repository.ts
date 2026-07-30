import { eq, and, isNull } from 'drizzle-orm';
import { TenantRepository } from './base.repository.js';
import { assetAttachments } from '../db/schema/asset.schema.js';

export type InsertAttachment = typeof assetAttachments.$inferInsert;
export type SelectAttachment = typeof assetAttachments.$inferSelect;

/**
 * Handles database operations for Asset Attachments.
 * Strictly metadata persistence, zero storage SDK calls.
 */
export class AttachmentRepository extends TenantRepository {
  /**
   * Creates attachment metadata in the database.
   * Can be executed within a transaction scope if `this` is a txRepo.
   */
  async create(data: Omit<InsertAttachment, 'id' | 'createdAt' | 'deletedAt'>): Promise<SelectAttachment> {
    const [attachment] = await this.db
      .insert(assetAttachments)
      .values(data)
      .returning();
      
    return attachment;
  }

  /**
   * Finds an attachment by ID, ensuring it belongs to the specified asset and tenant,
   * and has not been soft-deleted.
   */
  async findById(id: number, assetId: number): Promise<SelectAttachment | undefined> {
    const [attachment] = await this.db
      .select()
      .from(assetAttachments)
      .where(
        and(
          eq(assetAttachments.id, id),
          eq(assetAttachments.assetId, assetId),
          isNull(assetAttachments.deletedAt)
        )
      );

    return attachment;
  }

  /**
   * Lists all active (non-deleted) attachments for a given asset.
   */
  async findAllByAsset(assetId: number): Promise<SelectAttachment[]> {
    return await this.db
      .select()
      .from(assetAttachments)
      .where(
        and(
          eq(assetAttachments.assetId, assetId),
          isNull(assetAttachments.deletedAt)
        )
      )
      .orderBy(assetAttachments.createdAt);
  }

  /**
   * Soft-deletes an attachment metadata record.
   * Hard deletion is not used here to maintain audit trails.
   */
  async softDelete(id: number, assetId: number): Promise<SelectAttachment | undefined> {
    const [deletedAttachment] = await this.db
      .update(assetAttachments)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(assetAttachments.id, id),
          eq(assetAttachments.assetId, assetId),
          isNull(assetAttachments.deletedAt)
        )
      )
      .returning();

    return deletedAttachment;
  }
}

export const attachmentRepository = new AttachmentRepository();
