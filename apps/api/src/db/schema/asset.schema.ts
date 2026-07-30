import { pgTable, bigserial, varchar, timestamp, bigint, pgEnum, date, numeric, integer, unique, jsonb, text, index } from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema.js';

export const assetCategories = pgTable('asset_categories', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tenantId: bigint('tenant_id', { mode: 'number' }).notNull().references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const locations = pgTable('locations', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tenantId: bigint('tenant_id', { mode: 'number' }).notNull().references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const departments = pgTable('departments', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tenantId: bigint('tenant_id', { mode: 'number' }).notNull().references(() => tenants.id),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

import { users } from './user.schema.js';

// Enums for assets
export const assignmentTypeEnum = pgEnum('assignment_type', ['individual', 'shared', 'unassigned']);
export const assetStatusEnum = pgEnum('asset_status', ['active', 'repair', 'lost', 'retired', 'disposed']);
export const assetConditionEnum = pgEnum('asset_condition', ['good', 'fair', 'poor']);

// Core Assets Table (Current State)
export const assets = pgTable(
  'assets',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    tenantId: bigint('tenant_id', { mode: 'number' })
      .notNull()
      .references(() => tenants.id),
    assetCode: varchar('asset_code', { length: 50 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    categoryId: bigint('category_id', { mode: 'number' })
      .notNull()
      .references(() => assetCategories.id),
    locationId: bigint('location_id', { mode: 'number' })
      .notNull()
      .references(() => locations.id),
    departmentId: bigint('department_id', { mode: 'number' }).references(() => departments.id),
    currentAssignedUserId: bigint('current_assigned_user_id', { mode: 'number' }).references(() => users.id),
    assignmentType: assignmentTypeEnum('assignment_type').notNull().default('unassigned'),
    brand: varchar('brand', { length: 100 }),
    serialNumber: varchar('serial_number', { length: 100 }),
    purchaseDate: date('purchase_date'),
    purchasePrice: numeric('purchase_price', { precision: 12, scale: 2 }),
    warrantyEnd: date('warranty_end'),
    status: assetStatusEnum('status').notNull().default('active'),
    condition: assetConditionEnum('condition').notNull().default('good'),
    qrCodeToken: varchar('qr_code_token', { length: 255 }).notNull().unique(),
    version: integer('version').notNull().default(1),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => ({
    unqTenantAssetCode: unique('assets_tenant_id_asset_code_unique').on(t.tenantId, t.assetCode),
  })
);

export const eventCategoryEnum = pgEnum('event_category', [
  'LIFECYCLE',
  'ASSIGNMENT',
  'MAINTENANCE',
  'ATTACHMENT',
  'QR',
  'INVENTORY',
  'SECURITY',
  'SYSTEM',
]);

export const eventSeverityEnum = pgEnum('event_severity', [
  'INFO',
  'NOTICE',
  'WARNING',
  'ERROR',
  'CRITICAL',
]);

export const assetEventTypeEnum = pgEnum('asset_event_type', [
  'CREATED',
  'UPDATED',
  'DELETED',
  'ASSIGNED',
  'TRANSFERRED',
  'RETURNED',
  'STATUS_CHANGED',
  'MAINTENANCE_SCHEDULED',
  'MAINTENANCE_STARTED',
  'MAINTENANCE_PAUSED',
  'MAINTENANCE_RESUMED',
  'MAINTENANCE_FINISHED',
  'MAINTENANCE_CANCELLED',
  'MAINTENANCE_NOTE_ADDED',
  'MAINTENANCE_PART_ADDED',
  'INVENTORY_STARTED',
  'ASSET_VERIFIED',
  'INVENTORY_COMPLETED',
  'INVENTORY_CANCELLED',
  'RETIRED',
  'ATTACHMENT_UPLOADED',
  'ATTACHMENT_DELETED',
  'QR_GENERATED',
  'QR_REPLACED',
  'QR_PRINTED',
  'QR_REVOKED',
  'QR_SCANNED',
  'IMPORTED',
  'EXPORTED',
  'BULK_UPDATE',
  'BULK_DELETE',
]);

// Asset Assignments (History - Source of Truth)
export const assetAssignments = pgTable('asset_assignments', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tenantId: bigint('tenant_id', { mode: 'number' })
    .notNull()
    .references(() => tenants.id),
  assetId: bigint('asset_id', { mode: 'number' })
    .notNull()
    .references(() => assets.id),
  assignmentType: assignmentTypeEnum('assignment_type').notNull(),
  userId: bigint('user_id', { mode: 'number' }).references(() => users.id),
  departmentId: bigint('department_id', { mode: 'number' }).references(() => departments.id),
  assignedAt: timestamp('assigned_at').notNull().defaultNow(),
  returnedAt: timestamp('returned_at'),
  createdBy: bigint('created_by', { mode: 'number' })
    .notNull()
    .references(() => users.id),
});

// Asset Events (Lifecycle Timeline)
export const assetEvents = pgTable(
  'asset_events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    tenantId: bigint('tenant_id', { mode: 'number' })
      .notNull()
      .references(() => tenants.id),
    assetId: bigint('asset_id', { mode: 'number' })
      .notNull()
      .references(() => assets.id),
    eventType: assetEventTypeEnum('event_type').notNull(),
    category: eventCategoryEnum('category').notNull().default('SYSTEM'),
    severity: eventSeverityEnum('severity').notNull().default('INFO'),
    oldValue: jsonb('old_value'),
    newValue: jsonb('new_value'),
    actorUserId: bigint('actor_user_id', { mode: 'number' }).references(() => users.id),
    actorNameSnapshot: varchar('actor_name_snapshot', { length: 255 }).notNull(),
    note: text('note'),
    requestId: varchar('request_id', { length: 100 }),
    correlationId: varchar('correlation_id', { length: 100 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantAssetIdx: index('asset_events_tenant_asset_idx').on(table.tenantId, table.assetId),
    createdAtIdx: index('asset_events_created_at_idx').on(table.createdAt),
    correlationIdx: index('asset_events_correlation_idx').on(table.correlationId),
  })
);

export const attachmentTypeEnum = pgEnum('attachment_type', [
  'photo',
  'invoice',
  'manual',
  'certificate',
  'warranty',
  'other',
]);

// Asset Attachments
export const assetAttachments = pgTable('asset_attachments', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  assetId: bigint('asset_id', { mode: 'number' })
    .notNull()
    .references(() => assets.id),
  originalFileName: varchar('original_file_name', { length: 255 }).notNull(),
  storageKey: varchar('storage_key', { length: 255 }).notNull().unique(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  fileSize: integer('file_size').notNull(),
  checksum: varchar('checksum', { length: 64 }).notNull(),
  attachmentType: attachmentTypeEnum('attachment_type').notNull().default('other'),
  uploadedBy: bigint('uploaded_by', { mode: 'number' })
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});
