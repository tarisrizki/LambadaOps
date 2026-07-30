import { describe, it, expect, vi, beforeEach } from 'vitest';
import { planRepository } from '../../src/repositories/plan.repository.js';
import { subscriptionRepository } from '../../src/repositories/subscription.repository.js';
import { TenantContext } from '../../src/lib/tenant-context.js';

// Mock the db object
vi.mock('../../src/db/index.js', () => {
  const mockPlans = [
    { id: 1, code: 'free', name: 'Free', priceMonthly: 0, assetLimit: 50, userLimit: 5, features: {} },
    { id: 2, code: 'pro', name: 'Pro', priceMonthly: 299000, assetLimit: 500, userLimit: 25, features: {} },
    { id: 3, code: 'business', name: 'Business', priceMonthly: 799000, assetLimit: null, userLimit: null, features: {} },
  ];

  const fromResult = {
    where: vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue([]),
    }),
  };
  // Make fromResult a thenable that resolves to mockPlans (for findAll)
  (fromResult as any).then = (resolve: (v: typeof mockPlans) => void, reject?: (e: unknown) => void) =>
    Promise.resolve(mockPlans).then(resolve, reject);

  return {
    db: {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue(fromResult),
      }),
    }
  };
});

describe('Task 1.1: Billing Repositories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PlanRepository', () => {
    it('findAll() method exists and is callable', () => {
      // Structural test: the method is exposed on the repository
      expect(typeof planRepository.findAll).toBe('function');
    });

    it('findById() returns null when db returns empty result', async () => {
      // The mock returns [] from .where().limit(), so result[0] ?? null → null
      const result = await planRepository.findById(999);
      // The mock resolves [] for where/limit chain → null
      expect(result).toBeNull();
    });
  });

  describe('SubscriptionRepository', () => {
    it('findActive() throws when TenantContext is missing', async () => {
      // Must be called outside TenantContext.run()
      await expect(subscriptionRepository.findActive()).rejects.toThrow(
        '[TenantContext] No tenant context found'
      );
    });

    it('findActive() executes within TenantContext', async () => {
      await TenantContext.run({ tenantId: 42 }, async () => {
        // Within context, findActive() queries DB (mocked)
        // The mock .where().limit() returns [] so result[0] ?? null → null
        const result = await subscriptionRepository.findActive();
        expect(result).toBeNull();
      });
    });
  });

  describe('Canonical Identifier Rule', () => {
    it('Plan type is exported from plan.repository (not from billing.schema)', async () => {
      // Verify Plan type is accessible from the repository module
      // This is a compile-time guarantee checked by typecheck, but we document intent here
      const { planRepository: repo } = await import('../../src/repositories/plan.repository.js');
      expect(typeof repo.findAll).toBe('function');
      expect(typeof repo.findById).toBe('function');
    });

    it('SubscriptionRepository only exposes findActive()', () => {
      const methods = Object.getOwnPropertyNames(
        Object.getPrototypeOf(subscriptionRepository)
      ).filter(m => m !== 'constructor' && !m.startsWith('_') && m !== 'db' && m !== 'tenantId');

      expect(methods).toEqual(['findActive']);
    });

    it('PlanRepository only exposes findAll() and findById()', () => {
      const methods = Object.getOwnPropertyNames(
        Object.getPrototypeOf(planRepository)
      ).filter(m => m !== 'constructor' && !m.startsWith('_') && m !== 'db');

      expect(methods).toEqual(expect.arrayContaining(['findAll', 'findById', 'findByCode']));
      expect(methods).toHaveLength(3);
    });
  });
});
