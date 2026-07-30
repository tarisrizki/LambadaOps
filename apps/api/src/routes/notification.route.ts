import { Hono } from 'hono';
import { notificationService } from '../services/notification.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import type { AccessTokenClaims } from '../lib/auth/jwt.js';

export const notificationRouter = new Hono<{ Variables: { user: AccessTokenClaims } }>();

notificationRouter.use('*', authMiddleware);

/**
 * [GET] /notifications/unread
 * Get unread notifications for the current user. SPEC §8.
 */
notificationRouter.get('/unread', async (c) => {
  const user = c.get('user');

  const notifications = await notificationService.getUnreadNotifications(user.userId);
  return c.json({ status: 'success', data: notifications });
});

/**
 * [POST] /notifications/:id/read
 * Mark a notification as read. SPEC §8: read_at is set, record is NOT deleted.
 */
notificationRouter.post('/:id/read', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const user = c.get('user');

  const notification = await notificationService.markAsRead(id, user.userId);
  return c.json({ status: 'success', data: notification });
});
