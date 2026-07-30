import { pgTable, bigserial, varchar, timestamp, bigint, jsonb, text, index } from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema.js';
import { users } from './user.schema.js';

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    tenantId: bigint('tenant_id', { mode: 'number' })
      .notNull()
      .references(() => tenants.id),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: varchar('entity_id', { length: 100 }).notNull(),
    action: varchar('action', { length: 50 }).notNull(),
    oldValue: jsonb('old_value'),
    newValue: jsonb('new_value'),
    actorId: bigint('actor_id', { mode: 'number' }).references(() => users.id),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    requestId: varchar('request_id', { length: 100 }),
    correlationId: varchar('correlation_id', { length: 100 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    tenantEntityIdx: index('audit_logs_tenant_entity_idx').on(table.tenantId, table.entityType, table.entityId),
    createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
  })
);
