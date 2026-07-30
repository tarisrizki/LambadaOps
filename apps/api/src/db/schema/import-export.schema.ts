import { pgTable, bigserial, bigint, varchar, timestamp, pgEnum, integer, jsonb } from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema.js';
import { users } from './user.schema.js';

export const importJobStatusEnum = pgEnum('import_job_status', ['pending', 'processing', 'completed', 'failed']);

export const importJobs = pgTable('import_jobs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tenantId: bigint('tenant_id', { mode: 'number' }).references(() => tenants.id).notNull(),
  uploadedById: bigint('uploaded_by_id', { mode: 'number' }).references(() => users.id).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  status: importJobStatusEnum('status').notNull().default('pending'),
  totalRows: integer('total_rows').notNull().default(0),
  successRows: integer('success_rows').notNull().default(0),
  failedRows: integer('failed_rows').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const importErrors = pgTable('import_errors', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  importJobId: bigint('import_job_id', { mode: 'number' }).references(() => importJobs.id).notNull(),
  rowNumber: integer('row_number').notNull(),
  field: varchar('field', { length: 255 }),
  errorMessage: varchar('error_message', { length: 1000 }).notNull(),
  rawRowData: jsonb('raw_row_data').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const exportJobStatusEnum = pgEnum('export_job_status', ['pending', 'processing', 'completed', 'failed']);

export const exportJobs = pgTable('export_jobs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tenantId: bigint('tenant_id', { mode: 'number' }).references(() => tenants.id).notNull(),
  requestedById: bigint('requested_by_id', { mode: 'number' }).references(() => users.id).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'assets', 'tickets'
  status: exportJobStatusEnum('status').notNull().default('pending'),
  fileUrl: varchar('file_url', { length: 1000 }), // URL to download the generated CSV
  totalRows: integer('total_rows').notNull().default(0),
  errorMessage: varchar('error_message', { length: 1000 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
