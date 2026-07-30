import { pgTable, bigserial, bigint, varchar, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core';
import { tenants, roles } from './tenant.schema.js';

export const userStatusEnum = pgEnum('user_status', ['active', 'invited', 'suspended']);

export const users = pgTable(
  'users',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    tenantId: bigint('tenant_id', { mode: 'number' })
      .notNull()
      .references(() => tenants.id),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    password: varchar('password', { length: 255 }).notNull(),
    roleId: bigint('role_id', { mode: 'number' })
      .notNull()
      .references(() => roles.id),
    status: userStatusEnum('status').notNull().default('active'),
    deletedAt: timestamp('deleted_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at')
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // Enforce uniqueness of email per tenant
    tenantEmailUnique: unique('users_tenant_id_email_unique').on(table.tenantId, table.email),
  }),
);
