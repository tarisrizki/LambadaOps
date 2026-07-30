import { pgTable, bigserial, bigint, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema.js';
import { users } from './user.schema.js';

export const notificationTypeEnum = pgEnum('notification_type', [
  'ticket_assigned',
  'maintenance_due',
  'warranty_expiring',
  'system_alert',
]);

export const notifications = pgTable('notifications', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tenantId: bigint('tenant_id', { mode: 'number' })
    .notNull()
    .references(() => tenants.id),
  userId: bigint('user_id', { mode: 'number' })
    .notNull()
    .references(() => users.id),
  type: notificationTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: varchar('message', { length: 1000 }).notNull(),
  actionUrl: varchar('action_url', { length: 500 }),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
