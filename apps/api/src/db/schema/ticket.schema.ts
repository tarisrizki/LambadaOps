import { pgTable, serial, integer, text, varchar, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema.js';
import { users } from './user.schema.js';
import { assets } from './asset.schema.js';

export const ticketStatusEnum = pgEnum('ticket_status', [
  'open',
  'assigned',
  'in_progress',
  'resolved',
  'closed',
]);

export const ticketPriorityEnum = pgEnum('ticket_priority', [
  'low',
  'medium',
  'high',
  'urgent',
]);

export const tickets = pgTable('tickets', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  priority: ticketPriorityEnum('priority').notNull().default('medium'),
  status: ticketStatusEnum('status').notNull().default('open'),
  
  assetId: integer('asset_id').references(() => assets.id),
  
  creatorId: integer('creator_id').notNull().references(() => users.id),
  assignedToId: integer('assigned_to_id').references(() => users.id),
  
  version: integer('version').notNull().default(1),
  
  resolvedAt: timestamp('resolved_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
});

export const ticketComments = pgTable('ticket_comments', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').notNull().references(() => tenants.id),
  ticketId: integer('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  authorId: integer('author_id').notNull().references(() => users.id),
  
  content: text('content').notNull(),
  
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
});
