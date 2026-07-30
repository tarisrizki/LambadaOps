import { and, eq, inArray } from 'drizzle-orm';
import { subscriptions } from '../db/schema/billing.schema.js';
import type { SubscriptionStatus } from '../db/schema/billing.schema.js';
import { GlobalRepository, TenantRepository } from './base.repository.js';

// ─── Repository-owned Domain Types ───────────────────────────────────────────
// Services must import these types from this file.
// Services must never import from billing.schema.ts directly.

export type Subscription = typeof subscriptions.$inferSelect;
export type CreateSubscriptionInput = {
  tenantId: number;
  planId: number;
  status: SubscriptionStatus;
  startedAt?: Date;
  endsAt?: Date;
};
export { type SubscriptionStatus };

// ─── Active statuses ──────────────────────────────────────────────────────────

/** Statuses considered "active" for feature access purposes. */
const ACTIVE_STATUSES: SubscriptionStatus[] = ['trialing', 'active'];

// ─── GlobalSubscriptionRepository ────────────────────────────────────────────

/**
 * Global (pre-auth) access to the `subscriptions` table.
 *
 * REPOSITORY CLASSIFICATION: GlobalRepository
 * Used by: RegistrationService, SubscriptionService (pre-auth phase)
 * Does NOT require TenantContext.
 *
 * RULE: These methods operate before TenantContext is initialized.
 * Must never be called in a context where TenantContext already exists —
 * use SubscriptionRepository instead.
 */
export class GlobalSubscriptionRepository extends GlobalRepository {
  /**
   * Creates a new subscription row.
   * Used by SubscriptionService.createTrialing() — called from RegistrationService.
   */
  async create(data: CreateSubscriptionInput): Promise<Subscription> {
    const result = await this.db
      .insert(subscriptions)
      .values({
        tenantId: data.tenantId,
        planId: data.planId,
        status: data.status,
        startedAt: data.startedAt ?? new Date(),
        endsAt: data.endsAt,
      })
      .returning();

    return result[0]!;
  }

  /**
   * Finds any subscription for a given tenant ID (active or otherwise).
   *
   * WARNING: Global lookup — operates without TenantContext.
   * For use by SubscriptionService.createTrialing() idempotency guard only.
   */
  async findByTenantId(tenantId: number): Promise<Subscription[]> {
    return this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, tenantId));
  }

  /**
   * Activates a subscription (trialing → active, or past_due → active).
   * Used by payment webhook handler (Task 1.4).
   */
  async activate(id: number): Promise<void> {
    await this.db
      .update(subscriptions)
      .set({ status: 'active', startedAt: new Date() })
      .where(eq(subscriptions.id, id));
  }

  /**
   * Marks a subscription as past_due.
   * Used by payment webhook handler (Task 1.4).
   */
  async markPastDue(id: number): Promise<void> {
    await this.db
      .update(subscriptions)
      .set({ status: 'past_due' })
      .where(eq(subscriptions.id, id));
  }

  /**
   * Cancels a subscription (active → cancelled).
   * Used by SubscriptionService.cancel() — called from user-initiated cancel route.
   */
  async cancel(id: number): Promise<void> {
    await this.db
      .update(subscriptions)
      .set({ status: 'cancelled', cancelledAt: new Date() })
      .where(eq(subscriptions.id, id));
  }
}

export const globalSubscriptionRepository = new GlobalSubscriptionRepository();

// ─── SubscriptionRepository ───────────────────────────────────────────────────

/**
 * Tenant-scoped (post-auth) access to the `subscriptions` table.
 *
 * REPOSITORY CLASSIFICATION: TenantRepository
 * REQUIRES TenantContext to be initialized. Will throw immediately if called
 * outside of an authenticated request scope.
 */
export class SubscriptionRepository extends TenantRepository {
  /**
   * Returns the current active subscription for the tenant.
   *
   * "Active" means status is 'trialing' or 'active'.
   * Returns null if no active subscription exists (e.g., cancelled, past_due).
   */
  async findActive(): Promise<Subscription | null> {
    const result = await this.db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.tenantId, this.tenantId),
          inArray(subscriptions.status, ACTIVE_STATUSES)
        )
      )
      .limit(1);

    return result[0] ?? null;
  }
}

export const subscriptionRepository = new SubscriptionRepository();
