import { pgTable, bigserial, varchar, timestamp, bigint, pgEnum, integer, index, text, boolean } from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema.js';
import { assets, locations, departments } from './asset.schema.js';
import { users } from './user.schema.js';

export const inventorySessionStatusEnum = pgEnum('inventory_session_status', [
  'planned',
  'ready',
  'in_progress',
  'paused',
  'completed',
  'cancelled',
]);

export const inventoryItemStatusEnum = pgEnum('inventory_item_status', [
  'pending',
  'found',
  'missing',
  'unexpected',
  'damaged',
  'requires_review',
]);

// Inventory Session (Aggregate Root)
export const stocktakingSessions = pgTable('stocktaking_sessions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tenantId: bigint('tenant_id', { mode: 'number' })
    .notNull()
    .references(() => tenants.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  
  // Scopes (Optional filters for baseline generation)
  locationId: bigint('location_id', { mode: 'number' }).references(() => locations.id),
  departmentId: bigint('department_id', { mode: 'number' }).references(() => departments.id),

  status: inventorySessionStatusEnum('status').notNull().default('planned'),
  
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  
  createdBy: bigint('created_by', { mode: 'number' })
    .notNull()
    .references(() => users.id),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => ({
  tenantStatusIdx: index('stocktaking_sessions_tenant_status_idx').on(table.tenantId, table.status),
}));

// Stocktaking Items (The baseline and scanned items)
export const stocktakingItems = pgTable('stocktaking_items', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tenantId: bigint('tenant_id', { mode: 'number' })
    .notNull()
    .references(() => tenants.id),
  sessionId: bigint('session_id', { mode: 'number' })
    .notNull()
    .references(() => stocktakingSessions.id, { onDelete: 'cascade' }),
  assetId: bigint('asset_id', { mode: 'number' })
    .notNull()
    .references(() => assets.id),
  
  // Snapshots of what was expected at the time of baseline generation
  expectedLocationId: bigint('expected_location_id', { mode: 'number' }),
  expectedDepartmentId: bigint('expected_department_id', { mode: 'number' }),
  expectedAssignedUserId: bigint('expected_assigned_user_id', { mode: 'number' }),
  expectedStatus: varchar('expected_status', { length: 50 }),
  expectedCondition: varchar('expected_condition', { length: 50 }),
  
  // Scan metadata
  status: inventoryItemStatusEnum('status').notNull().default('pending'),
  scannedAt: timestamp('scanned_at'),
  scannedBy: bigint('scanned_by', { mode: 'number' }).references(() => users.id),
  
  version: integer('version').notNull().default(1),
}, (table) => ({
  sessionAssetIdx: index('stocktaking_items_session_asset_idx').on(table.sessionId, table.assetId),
  tenantSessionStatusIdx: index('stocktaking_items_tenant_session_status_idx').on(table.tenantId, table.sessionId, table.status),
}));

export const exceptionCategoryEnum = pgEnum('exception_category', [
  'missing',
  'unexpected',
  'wrong_location',
  'wrong_assignee',
  'wrong_department',
  'damaged',
  'retired_found',
  'duplicate_scan',
  'unknown_qr',
]);

// Inventory Exceptions (Discrepancies attached to items)
export const inventoryExceptions = pgTable('inventory_exceptions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tenantId: bigint('tenant_id', { mode: 'number' })
    .notNull()
    .references(() => tenants.id),
  itemId: bigint('item_id', { mode: 'number' })
    .notNull()
    .references(() => stocktakingItems.id, { onDelete: 'cascade' }),
  category: exceptionCategoryEnum('category').notNull(),
  description: text('description').notNull(),
  resolved: boolean('resolved').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Inventory Notes (Immutable logs)
export const inventoryNotes = pgTable('inventory_notes', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  sessionId: bigint('session_id', { mode: 'number' })
    .notNull()
    .references(() => stocktakingSessions.id, { onDelete: 'cascade' }),
  authorId: bigint('author_id', { mode: 'number' })
    .notNull()
    .references(() => users.id),
  note: text('note').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
