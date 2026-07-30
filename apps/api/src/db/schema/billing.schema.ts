import {
  pgTable,
  pgEnum,
  bigserial,
  varchar,
  integer,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema.js';

// ─── Enums ────────────────────────────────────────────────────────────────────

/**
 * Single source of truth for subscription status.
 *
 * RULE: Application code must reference these values only through the type
 * inferred from this enum (via SubscriptionRepository DTOs).
 * Never use raw string literals in business logic.
 */
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'trialing',
  'active',
  'past_due',
  'cancelled',
]);

// ─── plans ────────────────────────────────────────────────────────────────────

/**
 * Product tiers for LambadaOps subscriptions.
 *
 * CANONICAL IDENTIFIER RULE:
 *   - `code` is the only stable identifier for application logic. Use it always.
 *   - `name` is a display label only — may be changed without notice.
 *   - `id` is an internal database detail — must never appear in service logic,
 *     API responses, or conditional branches in application code.
 *
 * Seeded values: 'free', 'pro', 'business'
 */
export const plans = pgTable('plans', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  /**
   * Immutable canonical identifier. Referenced by all business logic.
   * Never changed after seed. Example: 'free', 'pro', 'business'.
   */
  code: varchar('code', { length: 50 }).notNull().unique(),
  /** Display label only — not safe to use in business logic comparisons. */
  name: varchar('name', { length: 255 }).notNull(),
  /** Price in smallest IDR unit (Rupiah). 0 = free. */
  priceMonthly: integer('price_monthly').notNull().default(0),
  /** Maximum assets allowed. null = unlimited. */
  assetLimit: integer('asset_limit'),
  /** Maximum users allowed. null = unlimited. */
  userLimit: integer('user_limit'),
  /** Feature flags for this plan tier. */
  features: jsonb('features').notNull().default({}),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ─── subscriptions ────────────────────────────────────────────────────────────

export const subscriptions = pgTable('subscriptions', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  tenantId: bigserial('tenant_id', { mode: 'number' })
    .notNull()
    .references(() => tenants.id),
  planId: bigserial('plan_id', { mode: 'number' })
    .notNull()
    .references(() => plans.id),
  status: subscriptionStatusEnum('status').notNull(),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  endsAt: timestamp('ends_at'),
  cancelledAt: timestamp('cancelled_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at')
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ─── webhook_logs ─────────────────────────────────────────────────────────────

/**
 * Idempotency guard for payment gateway events.
 *
 * Constraint: UNIQUE(provider, event_id)
 * Before processing any webhook, check this table for existing event_id.
 * If found, skip processing — the event has already been handled.
 *
 * This table is global (no tenant_id) because payment events arrive before
 * tenant resolution in the webhook flow.
 */
export const webhookLogs = pgTable('webhook_logs', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  provider: varchar('provider', { length: 50 }).notNull(),
  /**
   * Deduplication key from the payment provider.
   * Combined with `provider` forms a globally unique event identifier.
   */
  eventId: varchar('event_id', { length: 255 }).notNull(),
  payload: jsonb('payload').notNull(),
  /** null = not yet processed. Set to current timestamp after successful processing. */
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ─── Exported Types ───────────────────────────────────────────────────────────

export type SubscriptionStatus = typeof subscriptionStatusEnum.enumValues[number];
