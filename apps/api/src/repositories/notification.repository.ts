import { eq, and, desc, isNull } from 'drizzle-orm';
import { notifications } from '../db/schema/notification.schema.js';
import { TenantRepository } from './base.repository.js';

export class NotificationRepository extends TenantRepository {
  /**
   * Insert a new notification.
   */
  async insert(data: typeof notifications.$inferInsert) {
    const [notification] = await this.db.insert(notifications).values(data).returning();
    return notification;
  }

  /**
   * Get all unread notifications for a specific user.
   */
  async getUnreadForUser(userId: number) {
    return this.db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.tenantId, this.tenantId),
          eq(notifications.userId, userId),
          isNull(notifications.readAt)
        )
      )
      .orderBy(desc(notifications.createdAt));
  }

  /**
   * Mark a notification as read.
   */
  async markAsRead(id: number, userId: number) {
    const [updated] = await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, id),
          eq(notifications.tenantId, this.tenantId),
          eq(notifications.userId, userId)
        )
      )
      .returning();
    return updated;
  }
}

export const notificationRepository = new NotificationRepository();
