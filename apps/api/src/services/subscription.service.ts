import {
  type GlobalSubscriptionRepository,
  globalSubscriptionRepository,
  type Subscription,
} from '../repositories/subscription.repository.js';
import { planRepository, type PlanCode } from '../repositories/plan.repository.js';
import {
  SubscriptionConflictError,
  BusinessRuleError,
} from '../lib/errors.js';
import { webhookLogRepository } from '../repositories/webhook-log.repository.js';
import type { PaymentDomainEvent } from '../lib/payment/webhook.adapter.js';

/**
 * Owns all subscription state transitions.
 *
 * ARCHITECTURAL RULE:
 *   This is the ONLY service permitted to mutate subscription records.
 *   All state transitions must go through this service — never via direct
 *   repository calls from routes or other services.
 *
 * State machine (Task 1.2 implements rows 1 and 5):
 *   (none)    → trialing  : createTrialing()  [registration]
 *   trialing  → active    : activate()         [Task 1.4 webhook]
 *   active    → cancelled : cancel()           [user-initiated]
 *   active    → past_due  : markPastDue()      [Task 1.4 webhook]
 *   past_due  → active    : activate()         [Task 1.4 webhook]
 */
export class SubscriptionService {
  constructor(
    private readonly subscriptionRepo: GlobalSubscriptionRepository = globalSubscriptionRepository,
  ) {}

  /**
   * Creates a trialing subscription for a new tenant.
   *
   * Called ONLY by RegistrationService during tenant registration.
   * Operates pre-auth — no TenantContext required.
   *
   * @throws SubscriptionConflictError if the tenant already has an active subscription
   */
  async createTrialing(tenantId: number, planCode: PlanCode): Promise<Subscription> {
    // Idempotency guard: prevent duplicate subscriptions
    const existing = await this.subscriptionRepo.findByTenantId(tenantId);
    const hasActive = existing.some(
      (s) => s.status === 'trialing' || s.status === 'active'
    );

    if (hasActive) {
      throw new SubscriptionConflictError(
        `Tenant ${tenantId} already has an active or trialing subscription`
      );
    }

    // Look up plan by canonical code — never by ID
    const plan = await planRepository.findByCode(planCode);
    if (!plan) {
      throw new Error(
        `Plan '${planCode}' not found. Ensure the seed has been run (bun run db:seed).`
      );
    }

    return this.subscriptionRepo.create({
      tenantId,
      planId: plan.id,
      status: 'trialing',
      startedAt: new Date(),
    });
  }

  /**
   * Cancels the active subscription for a tenant.
   *
   * Legal only from 'active' status.
   *
   * @throws BusinessRuleError if the subscription is not in 'active' state
   */
  async cancel(tenantId: number): Promise<void> {
    const subscriptions = await this.subscriptionRepo.findByTenantId(tenantId);
    const active = subscriptions.find((s) => s.status === 'active');

    if (!active) {
      const states = subscriptions.map((s) => s.status).join(', ') || 'none';
      throw new BusinessRuleError(
        `Cannot cancel subscription: no active subscription found (current states: ${states}). ` +
        `Cancellation is only permitted from 'active' status.`
      );
    }

    await this.subscriptionRepo.cancel(active.id);
  }

  /**
   * Processes a normalized domain event from a payment gateway webhook.
   * Enforces business rules and state machine transitions.
   * Handles idempotency via webhookLogs.
   */
  async processWebhookEvent(event: PaymentDomainEvent): Promise<void> {
    // 1. Idempotency Check
    const existingLog = await webhookLogRepository.findByEventId(event.provider, event.eventId);
    if (existingLog && existingLog.processedAt) {
      // Already processed successfully, skip safely
      return;
    }

    // Insert log if it doesn't exist (to track incoming payloads)
    let logId = existingLog?.id;
    if (!existingLog) {
      const newLog = await webhookLogRepository.create({
        provider: event.provider,
        eventId: event.eventId,
        payload: event.rawPayload,
      });
      logId = newLog.id;
    }

    // 2. Resolve Subscription State
    const subscriptions = await this.subscriptionRepo.findByTenantId(event.tenantId);
    // Find the relevant subscription (for MVP, we assume 1 active/trialing/past_due per tenant)
    const targetSub = subscriptions.find(
      (s) => s.status === 'trialing' || s.status === 'active' || s.status === 'past_due'
    );

    if (!targetSub) {
      // If no valid subscription found (e.g. it was cancelled or never created), we cannot process it.
      // Log critical, but return safely so webhook doesn't retry forever.
      console.warn(`[CRITICAL] Webhook event received for tenant ${event.tenantId} but no valid subscription found.`);
      return;
    }

    // 3. Apply State Machine Rules
    switch (event.type) {
      case 'PaymentSucceeded':
        if (targetSub.status === 'trialing') {
          await this.subscriptionRepo.activate(targetSub.id);
        } else if (targetSub.status === 'active') {
          // Normal renewal, maybe update endsAt if we tracked it, but status remains active
        } else {
          throw new BusinessRuleError(`Cannot transition from ${targetSub.status} to active via PaymentSucceeded`);
        }
        break;

      case 'PaymentFailed':
        if (targetSub.status === 'active') {
          await this.subscriptionRepo.markPastDue(targetSub.id);
        } else if (targetSub.status === 'trialing') {
          // Trial ended and payment failed -> past_due
          await this.subscriptionRepo.markPastDue(targetSub.id);
        } else if (targetSub.status === 'past_due') {
          // Already past due, ignore
        } else {
          throw new BusinessRuleError(`Cannot transition from ${targetSub.status} to past_due via PaymentFailed`);
        }
        break;

      case 'PaymentRecovered':
        if (targetSub.status === 'past_due') {
          await this.subscriptionRepo.activate(targetSub.id);
        } else {
          throw new BusinessRuleError(`Cannot transition from ${targetSub.status} to active via PaymentRecovered`);
        }
        break;
      
      default:
        throw new BusinessRuleError(`Unknown event type: ${event.type}`);
    }

    // 4. Mark as processed
    if (logId) {
      await webhookLogRepository.markProcessed(logId);
    }
  }
}

export const subscriptionService = new SubscriptionService();
