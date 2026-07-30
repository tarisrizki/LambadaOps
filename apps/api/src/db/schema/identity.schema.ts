import { pgTable, bigserial, varchar, timestamp, bigint, pgEnum, integer, index, text, boolean } from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema.js';
import { assets } from './asset.schema.js';
import { users } from './user.schema.js';

export const identityMediumEnum = pgEnum('identity_medium', [
  'qr',
  'barcode',
  'nfc',
  'rfid',
  'ble',
  'manual',
]);

export const identityStatusEnum = pgEnum('identity_status', [
  'generated',
  'printed',
  'attached',
  'active',
  'replaced',
  'revoked',
  'archived',
]);

// Asset Identities
export const assetIdentities = pgTable('asset_identities', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tenantId: bigint('tenant_id', { mode: 'number' })
    .notNull()
    .references(() => tenants.id),
  assetId: bigint('asset_id', { mode: 'number' })
    .notNull()
    .references(() => assets.id),
  
  medium: identityMediumEnum('medium').notNull().default('qr'),
  token: varchar('token', { length: 255 }).notNull().unique(), // The unguessable token (e.g. UUID)
  hash: varchar('hash', { length: 255 }).notNull(), // The signature/HMAC to verify authenticity
  
  status: identityStatusEnum('status').notNull().default('generated'),
  
  schemaVersion: integer('schema_version').notNull().default(1),
  version: integer('version').notNull().default(1), // Optimistic locking
  
  expiresAt: timestamp('expires_at'),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}, (table) => ({
  tenantAssetIdx: index('asset_identities_tenant_asset_idx').on(table.tenantId, table.assetId),
  tokenIdx: index('asset_identities_token_idx').on(table.token),
}));

export const printJobStatusEnum = pgEnum('print_job_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);

// Identity Print Jobs
export const identityPrintJobs = pgTable('identity_print_jobs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tenantId: bigint('tenant_id', { mode: 'number' })
    .notNull()
    .references(() => tenants.id),
  createdBy: bigint('created_by', { mode: 'number' })
    .notNull()
    .references(() => users.id),
  status: printJobStatusEnum('status').notNull().default('pending'),
  format: varchar('format', { length: 50 }).notNull(), // e.g. 'pdf', 'csv', 'zpl'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
});

// Identity Print Job Items (linking identities to jobs)
export const identityPrintJobItems = pgTable('identity_print_job_items', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  printJobId: bigint('print_job_id', { mode: 'number' })
    .notNull()
    .references(() => identityPrintJobs.id, { onDelete: 'cascade' }),
  identityId: bigint('identity_id', { mode: 'number' })
    .notNull()
    .references(() => assetIdentities.id),
});

// Identity Scans (Immutable history)
export const identityScans = pgTable('identity_scans', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tenantId: bigint('tenant_id', { mode: 'number' })
    .notNull()
    .references(() => tenants.id),
  identityId: bigint('identity_id', { mode: 'number' })
    .references(() => assetIdentities.id), // nullable in case of unknown QR scans
  
  scannedToken: varchar('scanned_token', { length: 255 }).notNull(),
  
  // Context
  userId: bigint('user_id', { mode: 'number' }).references(() => users.id), // Nullable for public scans
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  latitude: varchar('latitude', { length: 50 }),
  longitude: varchar('longitude', { length: 50 }),
  
  // Result
  isSuccessful: boolean('is_successful').notNull().default(false),
  failureReason: varchar('failure_reason', { length: 255 }),
  
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  identityIdx: index('identity_scans_identity_idx').on(table.identityId),
  createdAtIdx: index('identity_scans_created_at_idx').on(table.createdAt),
}));
