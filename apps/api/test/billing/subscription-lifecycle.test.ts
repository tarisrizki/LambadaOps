import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subscriptionService } from '../../src/services/subscription.service.js';
import { globalSubscriptionRepository } from '../../src/repositories/subscription.repository.js';
import { planRepository } from '../../src/repositories/plan.repository.js';
import { webhookLogRepository } from '../../src/repositories/webhook-log.repository.js';
import { SubscriptionConflictError, BusinessRuleError } from '../../src/lib/errors.js';

vi.mock('../../src/repositories/subscription.repository.js', () => ({
  globalSubscriptionRepository: {
    findByTenantId: vi.fn(),
    create: vi.fn(),
    cancel: vi.fn(),
    activate: vi.fn(),
    markPastDue: vi.fn(),
  },
}));

vi.mock('../../src/repositories/webhook-log.repository.js', () => ({
  webhookLogRepository: {
    findByEventId: vi.fn(),
    create: vi.fn(),
    markProcessed: vi.fn(),
  },
}));

vi.mock('../../src/repositories/plan.repository.js', () => ({
  planRepository: {
    findByCode: vi.fn(),
  },
}));

describe('SubscriptionService State Machine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTrialing', () => {
    it('creates a trialing subscription if none exist', async () => {
      vi.mocked(globalSubscriptionRepository.findByTenantId).mockResolvedValue([]);
      vi.mocked(planRepository.findByCode).mockResolvedValue({ id: 99, code: 'free' } as any);
      vi.mocked(globalSubscriptionRepository.create).mockResolvedValue({ id: 100 } as any);

      const result = await subscriptionService.createTrialing(1, 'free');

      expect(globalSubscriptionRepository.findByTenantId).toHaveBeenCalledWith(1);
      expect(planRepository.findByCode).toHaveBeenCalledWith('free');
      expect(globalSubscriptionRepository.create).toHaveBeenCalledWith({
        tenantId: 1,
        planId: 99,
        status: 'trialing',
        startedAt: expect.any(Date),
      });
      expect(result.id).toBe(100);
    });

    it('throws SubscriptionConflictError if tenant has an active subscription', async () => {
      vi.mocked(globalSubscriptionRepository.findByTenantId).mockResolvedValue([
        { status: 'active' } as any,
      ]);

      await expect(subscriptionService.createTrialing(1, 'free')).rejects.toThrow(
        SubscriptionConflictError
      );
      expect(globalSubscriptionRepository.create).not.toHaveBeenCalled();
    });

    it('throws SubscriptionConflictError if tenant has a trialing subscription', async () => {
      vi.mocked(globalSubscriptionRepository.findByTenantId).mockResolvedValue([
        { status: 'trialing' } as any,
      ]);

      await expect(subscriptionService.createTrialing(1, 'free')).rejects.toThrow(
        SubscriptionConflictError
      );
      expect(globalSubscriptionRepository.create).not.toHaveBeenCalled();
    });

    it('allows creation if tenant only has cancelled subscriptions', async () => {
      vi.mocked(globalSubscriptionRepository.findByTenantId).mockResolvedValue([
        { status: 'cancelled' } as any,
      ]);
      vi.mocked(planRepository.findByCode).mockResolvedValue({ id: 99 } as any);
      vi.mocked(globalSubscriptionRepository.create).mockResolvedValue({ id: 100 } as any);

      await subscriptionService.createTrialing(1, 'free');
      expect(globalSubscriptionRepository.create).toHaveBeenCalled();
    });

    it('throws error if plan is not found (seed missing)', async () => {
      vi.mocked(globalSubscriptionRepository.findByTenantId).mockResolvedValue([]);
      vi.mocked(planRepository.findByCode).mockResolvedValue(null);

      await expect(subscriptionService.createTrialing(1, 'free')).rejects.toThrow(
        /Plan 'free' not found/
      );
    });
  });

  describe('cancel', () => {
    it('transitions an active subscription to cancelled', async () => {
      vi.mocked(globalSubscriptionRepository.findByTenantId).mockResolvedValue([
        { id: 10, status: 'active' } as any,
      ]);

      await subscriptionService.cancel(1);

      expect(globalSubscriptionRepository.cancel).toHaveBeenCalledWith(10);
    });

    it('throws BusinessRuleError if no active subscription exists', async () => {
      vi.mocked(globalSubscriptionRepository.findByTenantId).mockResolvedValue([
        { id: 10, status: 'trialing' } as any, // Not 'active'
      ]);

      await expect(subscriptionService.cancel(1)).rejects.toThrow(BusinessRuleError);
      expect(globalSubscriptionRepository.cancel).not.toHaveBeenCalled();
    });
    
    it('throws BusinessRuleError if subscription is already cancelled', async () => {
      vi.mocked(globalSubscriptionRepository.findByTenantId).mockResolvedValue([
        { id: 10, status: 'cancelled' } as any,
      ]);

      await expect(subscriptionService.cancel(1)).rejects.toThrow(BusinessRuleError);
      expect(globalSubscriptionRepository.cancel).not.toHaveBeenCalled();
    });
  });

  describe('processWebhookEvent', () => {
    it('returns early if idempotency log indicates already processed', async () => {
      vi.mocked(webhookLogRepository.findByEventId).mockResolvedValue({ id: 1, processedAt: new Date() } as any);

      await subscriptionService.processWebhookEvent({
        type: 'PaymentSucceeded',
        eventId: 'evt_1',
        provider: 'mock',
        tenantId: 1,
        data: {},
        rawPayload: {},
      });

      expect(globalSubscriptionRepository.findByTenantId).not.toHaveBeenCalled();
      expect(webhookLogRepository.create).not.toHaveBeenCalled();
    });

    it('activates trialing subscription on PaymentSucceeded', async () => {
      vi.mocked(webhookLogRepository.findByEventId).mockResolvedValue(null);
      vi.mocked(webhookLogRepository.create).mockResolvedValue({ id: 1 } as any);
      vi.mocked(globalSubscriptionRepository.findByTenantId).mockResolvedValue([
        { id: 10, status: 'trialing' } as any,
      ]);

      await subscriptionService.processWebhookEvent({
        type: 'PaymentSucceeded',
        eventId: 'evt_1',
        provider: 'mock',
        tenantId: 1,
        data: {},
        rawPayload: {},
      });

      expect(globalSubscriptionRepository.activate).toHaveBeenCalledWith(10);
      expect(webhookLogRepository.markProcessed).toHaveBeenCalledWith(1);
    });

    it('marks active subscription as past_due on PaymentFailed', async () => {
      vi.mocked(webhookLogRepository.findByEventId).mockResolvedValue(null);
      vi.mocked(webhookLogRepository.create).mockResolvedValue({ id: 1 } as any);
      vi.mocked(globalSubscriptionRepository.findByTenantId).mockResolvedValue([
        { id: 10, status: 'active' } as any,
      ]);

      await subscriptionService.processWebhookEvent({
        type: 'PaymentFailed',
        eventId: 'evt_1',
        provider: 'mock',
        tenantId: 1,
        data: {},
        rawPayload: {},
      });

      expect(globalSubscriptionRepository.markPastDue).toHaveBeenCalledWith(10);
      expect(webhookLogRepository.markProcessed).toHaveBeenCalledWith(1);
    });

    it('rejects transitioning from cancelled via PaymentSucceeded', async () => {
      vi.mocked(webhookLogRepository.findByEventId).mockResolvedValue(null);
      vi.mocked(webhookLogRepository.create).mockResolvedValue({ id: 1 } as any);
      vi.mocked(globalSubscriptionRepository.findByTenantId).mockResolvedValue([
        { id: 10, status: 'cancelled' } as any,
      ]);

      // Note: processWebhookEvent currently returns early if targetSub is not found (status not trialing/active/past_due)
      // Wait, let's verify current logic: it warns and returns if targetSub is not found.
      // So no error is thrown, it just ignores.
      // If we want it to throw BusinessRuleError on impossible transitions, the current logic is to just skip if no active/trialing/past_due.
      await subscriptionService.processWebhookEvent({
        type: 'PaymentSucceeded',
        eventId: 'evt_1',
        provider: 'mock',
        tenantId: 1,
        data: {},
        rawPayload: {},
      });

      expect(globalSubscriptionRepository.activate).not.toHaveBeenCalled();
    });
  });
});
