import { describe, it, expect, beforeAll } from 'vitest';
import app from '../../src/index.js';
import { createTestTenant } from '../setup.integration.js';
import { db } from '../../src/db/index.js';
import { notifications } from '../../src/db/schema/notification.schema.js';

describe('Notification Domain Integration Tests', () => {
  let ctx: Awaited<ReturnType<typeof createTestTenant>>;
  let notificationId: number;

  beforeAll(async () => {
    ctx = await createTestTenant();

    // Create a dummy notification for testing
    const [inserted] = await db.insert(notifications).values({
      tenantId: ctx.tenant.id,
      userId: ctx.user.id,
      type: 'system_alert',
      title: 'Test Notification',
      message: 'This is a test notification.'
    }).returning();
    
    notificationId = inserted.id;
  });

  it('GET /api/notifications/unread > retrieves unread notifications', async () => {
    const res = await app.request('/api/notifications/unread', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ctx.token}`
      }
    });

    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.status).toBe('success');
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
    
    const notif = json.data.find((n: any) => n.id === notificationId);
    expect(notif).toBeDefined();
    expect(notif.readAt).toBeNull();
  });

  it('POST /api/notifications/:id/read > marks a notification as read', async () => {
    const res = await app.request(`/api/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ctx.token}`
      }
    });

    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.status).toBe('success');
    expect(json.data.id).toBe(notificationId);
    expect(json.data.readAt).not.toBeNull();
  });

  it('GET /api/notifications/unread > confirms the notification is no longer unread', async () => {
    const res = await app.request('/api/notifications/unread', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ctx.token}`
      }
    });

    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.status).toBe('success');
    
    const notif = json.data.find((n: any) => n.id === notificationId);
    expect(notif).toBeUndefined(); // Should not be in the unread list
  });
});
