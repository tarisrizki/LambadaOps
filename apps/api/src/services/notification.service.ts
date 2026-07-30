import { notificationRepository } from '../repositories/notification.repository.js';
import { NotFoundError } from '../lib/errors.js';

export type CreateNotificationInput = {
  tenantId: number;
  userId: number;
  type: 'ticket_assigned' | 'maintenance_due' | 'warranty_expiring' | 'system_alert';
  title: string;
  message: string;
  actionUrl?: string;
};

export class NotificationService {
  /**
   * Internal/System method to create a notification.
   * Notifications are created by the system, not directly by users.
   */
  async createNotification(data: CreateNotificationInput) {
    // We bypass the usual TenantContext run here if it's called from a background job,
    // but the repository uses TenantContext so this needs to be called within a TenantContext.run
    return notificationRepository.insert(data);
  }

  /**
   * Retrieves all unread notifications for a specific user.
   */
  async getUnreadNotifications(userId: number) {
    return notificationRepository.getUnreadForUser(userId);
  }

  /**
   * Marks a notification as read by the user.
   */
  async markAsRead(id: number, userId: number) {
    const updated = await notificationRepository.markAsRead(id, userId);
    if (!updated) {
      throw new NotFoundError('Notification');
    }
    return updated;
  }
}

export const notificationService = new NotificationService();
