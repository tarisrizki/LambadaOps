import { eq } from 'drizzle-orm';
import { plans } from '../db/schema/billing.schema.js';
import { GlobalRepository } from './base.repository.js';

// ─── Repository-owned Domain Types ───────────────────────────────────────────
// Services must import these types from this file.
// Services must never import from billing.schema.ts directly.

export type Plan = typeof plans.$inferSelect;
export type PlanCode = Plan['code'];

// ─── PlanRepository ───────────────────────────────────────────────────────────

/**
 * Read-only access to the `plans` table.
 *
 * Plans are global/system data (not tenant-scoped), so this extends
 * GlobalRepository — no TenantContext is required.
 *
 * CANONICAL IDENTIFIER RULE:
 *   Services must reference plans by `code` only.
 *   Never reference plans by `id` in application logic.
 */
export class PlanRepository extends GlobalRepository {
  /** Returns all available plans. */
  async findAll(): Promise<Plan[]> {
    return this.db.select().from(plans);
  }

  /** Finds a plan by its internal database ID. For internal use only. */
  async findById(id: number): Promise<Plan | null> {
    const result = await this.db
      .select()
      .from(plans)
      .where(eq(plans.id, id))
      .limit(1);

    return result[0] ?? null;
  }

  /**
   * Finds a plan by its canonical code identifier.
   *
   * CANONICAL IDENTIFIER RULE: Services must use this method to look up plans.
   * Never look up plans by `id` in business logic.
   *
   * @example planRepository.findByCode('free')
   */
  async findByCode(code: PlanCode): Promise<Plan | null> {
    const result = await this.db
      .select()
      .from(plans)
      .where(eq(plans.code, code))
      .limit(1);

    return result[0] ?? null;
  }
}

export const planRepository = new PlanRepository();
