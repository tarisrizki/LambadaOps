import { pgTable, bigserial, varchar, timestamp, bigint, pgEnum, date, numeric, integer, unique, text, index, boolean } from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema.js';
import { assets, assetAttachments } from './asset.schema.js';
import { users } from './user.schema.js';

export const maintenanceStatusEnum = pgEnum('maintenance_status', [
  'scheduled',
  'ready',
  'in_progress',
  'paused',
  'completed',
  'cancelled',
]);

// Maintenance Job (Aggregate Root)
export const maintenanceJobs = pgTable('maintenance_jobs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tenantId: bigint('tenant_id', { mode: 'number' })
    .notNull()
    .references(() => tenants.id),
  assetId: bigint('asset_id', { mode: 'number' })
    .notNull()
    .references(() => assets.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: maintenanceStatusEnum('status').notNull().default('scheduled'),
  scheduledDate: date('scheduled_date'),
  technicianId: bigint('technician_id', { mode: 'number' }).references(() => users.id),
  
  // Timing
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  
  // Cost tracking
  laborCost: numeric('labor_cost', { precision: 12, scale: 2 }).default('0'),
  partsCost: numeric('parts_cost', { precision: 12, scale: 2 }).default('0'),
  vendorCost: numeric('vendor_cost', { precision: 12, scale: 2 }).default('0'),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).default('0'),
  discountAmount: numeric('discount_amount', { precision: 12, scale: 2 }).default('0'),
  totalCost: numeric('total_cost', { precision: 12, scale: 2 }).default('0'),

  version: integer('version').notNull().default(1), // optimistic locking
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => ({
  tenantAssetIdx: index('maintenance_jobs_tenant_asset_idx').on(table.tenantId, table.assetId),
  tenantStatusIdx: index('maintenance_jobs_tenant_status_idx').on(table.tenantId, table.status),
  tenantScheduledIdx: index('maintenance_jobs_tenant_scheduled_idx').on(table.tenantId, table.scheduledDate),
}));

// Maintenance Tasks (Sub-entities/Checklists)
export const maintenanceTasks = pgTable('maintenance_tasks', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  maintenanceJobId: bigint('maintenance_job_id', { mode: 'number' })
    .notNull()
    .references(() => maintenanceJobs.id, { onDelete: 'cascade' }),
  taskName: varchar('task_name', { length: 255 }).notNull(),
  isCompleted: boolean('is_completed').notNull().default(false),
  completedAt: timestamp('completed_at'),
  completedBy: bigint('completed_by', { mode: 'number' }).references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Maintenance Parts (Spare parts used)
export const maintenanceParts = pgTable('maintenance_parts', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  maintenanceJobId: bigint('maintenance_job_id', { mode: 'number' })
    .notNull()
    .references(() => maintenanceJobs.id, { onDelete: 'cascade' }),
  partName: varchar('part_name', { length: 255 }).notNull(),
  partNumber: varchar('part_number', { length: 100 }),
  quantity: integer('quantity').notNull().default(1),
  unitCost: numeric('unit_cost', { precision: 12, scale: 2 }).notNull().default('0'),
  totalCost: numeric('total_cost', { precision: 12, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Maintenance Notes (Immutable activity log from technicians)
export const maintenanceNotes = pgTable('maintenance_notes', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  maintenanceJobId: bigint('maintenance_job_id', { mode: 'number' })
    .notNull()
    .references(() => maintenanceJobs.id, { onDelete: 'cascade' }),
  authorId: bigint('author_id', { mode: 'number' })
    .notNull()
    .references(() => users.id),
  note: text('note').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Maintenance Attachments (Links existing asset attachments to maintenance job)
export const maintenanceAttachments = pgTable('maintenance_attachments', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  maintenanceJobId: bigint('maintenance_job_id', { mode: 'number' })
    .notNull()
    .references(() => maintenanceJobs.id, { onDelete: 'cascade' }),
  attachmentId: bigint('attachment_id', { mode: 'number' })
    .notNull()
    .references(() => assetAttachments.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  unqJobAttachment: unique('unq_maintenance_job_attachment').on(table.maintenanceJobId, table.attachmentId),
}));
