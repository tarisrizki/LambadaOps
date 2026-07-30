import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initEnv } from '../../src/lib/env.js';
initEnv();
import { planLimitService } from '../../src/services/plan-limit.service.js';
import { subscriptionRepository } from '../../src/repositories/subscription.repository.js';
import { userRepository } from '../../src/repositories/user.repository.js';
import { planRepository } from '../../src/repositories/plan.repository.js';
import { assetRepository } from '../../src/repositories/asset.repository.js';
import { PlanLimitError, BusinessRuleError } from '../../src/lib/errors.js';

vi.mock('../../src/repositories/subscription.repository.js', () => ({
  subscriptionRepository: {
    findActive: vi.fn(),
  },
}));

vi.mock('../../src/repositories/user.repository.js', () => ({
  userRepository: {
    count: vi.fn(),
  },
}));

vi.mock('../../src/repositories/plan.repository.js', () => ({
  planRepository: {
    findById: vi.fn(),
  },
}));

vi.mock('../../src/repositories/asset.repository.js', () => ({
  assetRepository: {
    count: vi.fn(),
  },
}));

describe('PlanLimitService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkUserLimit', () => {
    it('throws BusinessRuleError if no active subscription', async () => {
      vi.mocked(subscriptionRepository.findActive).mockResolvedValue(null);

      await expect(planLimitService.checkUserLimit()).rejects.toThrow(BusinessRuleError);
      await expect(planLimitService.checkUserLimit()).rejects.toThrow('Tenant has no active subscription');
    });

    it('passes if plan has unlimited users (null)', async () => {
      vi.mocked(subscriptionRepository.findActive).mockResolvedValue({ planId: 1 } as any);
      vi.mocked(planRepository.findById).mockResolvedValue({ id: 1, userLimit: null } as any);

      // Should not throw
      await expect(planLimitService.checkUserLimit()).resolves.toBeUndefined();
      // Should bypass counting users completely
      expect(userRepository.count).not.toHaveBeenCalled();
    });

    it('throws PlanLimitError if current user count is equal to limit', async () => {
      vi.mocked(subscriptionRepository.findActive).mockResolvedValue({ planId: 1 } as any);
      vi.mocked(planRepository.findById).mockResolvedValue({ id: 1, userLimit: 5 } as any);
      vi.mocked(userRepository.count).mockResolvedValue(5);

      await expect(planLimitService.checkUserLimit()).rejects.toThrow(PlanLimitError);
      await expect(planLimitService.checkUserLimit()).rejects.toThrow('User limit reached. Your plan allows up to 5 users.');
    });

    it('passes if current user count is less than limit', async () => {
      vi.mocked(subscriptionRepository.findActive).mockResolvedValue({ planId: 1 } as any);
      vi.mocked(planRepository.findById).mockResolvedValue({ id: 1, userLimit: 5 } as any);
      vi.mocked(userRepository.count).mockResolvedValue(4);

      await expect(planLimitService.checkUserLimit()).resolves.toBeUndefined();
    });
  });

  describe('checkAssetLimit', () => {
    it('throws BusinessRuleError if no active subscription', async () => {
      vi.mocked(subscriptionRepository.findActive).mockResolvedValue(null);

      await expect(planLimitService.checkAssetLimit()).rejects.toThrow(BusinessRuleError);
    });

    it('passes if plan has unlimited assets (null)', async () => {
      vi.mocked(subscriptionRepository.findActive).mockResolvedValue({ planId: 1 } as any);
      vi.mocked(planRepository.findById).mockResolvedValue({ id: 1, assetLimit: null } as any);

      await expect(planLimitService.checkAssetLimit()).resolves.toBeUndefined();
    });

    it('throws PlanLimitError if current asset count exceeds limit', async () => {
      vi.mocked(subscriptionRepository.findActive).mockResolvedValue({ planId: 1 } as any);
      vi.mocked(planRepository.findById).mockResolvedValue({ id: 1, assetLimit: 50 } as any);
      vi.mocked(assetRepository.count).mockResolvedValue(50);

      await expect(planLimitService.checkAssetLimit()).rejects.toThrow(PlanLimitError);
      
      vi.mocked(assetRepository.count).mockResolvedValue(51);
      await expect(planLimitService.checkAssetLimit()).rejects.toThrow(PlanLimitError);
    });

    it('passes if current asset count is below limit', async () => {
      vi.mocked(subscriptionRepository.findActive).mockResolvedValue({ planId: 1 } as any);
      vi.mocked(planRepository.findById).mockResolvedValue({ id: 1, assetLimit: 50 } as any);
      vi.mocked(assetRepository.count).mockResolvedValue(49);

      await expect(planLimitService.checkAssetLimit()).resolves.toBeUndefined();
    });
  });
});
