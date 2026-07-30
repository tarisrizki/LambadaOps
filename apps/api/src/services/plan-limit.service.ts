import { subscriptionRepository } from '../repositories/subscription.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { planRepository } from '../repositories/plan.repository.js';
import { assetRepository } from '../repositories/asset.repository.js';
import { PlanLimitError, BusinessRuleError } from '../lib/errors.js';

/**
 * Service responsible for enforcing plan limits on resources (Users, Assets).
 * 
 * Rules:
 * - Requires an active subscription.
 * - Compares current counts against the plan's limit.
 * - Plan limits that are `null` represent "unlimited".
 */
export class PlanLimitService {
  /**
   * Checks if the tenant can create a new user based on their plan limits.
   * Throws PlanLimitError if the limit is reached or exceeded.
   */
  async checkUserLimit(): Promise<void> {
    const activeSub = await subscriptionRepository.findActive();
    if (!activeSub) {
      throw new BusinessRuleError('Tenant has no active subscription');
    }

    const plan = await planRepository.findById(activeSub.planId);
    if (!plan) {
      throw new BusinessRuleError('Active subscription references an invalid plan');
    }

    // null means unlimited
    if (plan.userLimit === null) {
      return;
    }

    const currentUsersCount = await userRepository.count();

    if (currentUsersCount >= plan.userLimit) {
      throw new PlanLimitError(`User limit reached. Your plan allows up to ${plan.userLimit} users.`);
    }
  }

  /**
   * Checks if the tenant can create a new asset based on their plan limits.
   * Throws PlanLimitError if the limit is reached or exceeded.
   */
  async checkAssetLimit(): Promise<void> {
    const activeSub = await subscriptionRepository.findActive();
    if (!activeSub) {
      throw new BusinessRuleError('Tenant has no active subscription');
    }

    const plan = await planRepository.findById(activeSub.planId);
    if (!plan) {
      throw new BusinessRuleError('Active subscription references an invalid plan');
    }

    // null means unlimited
    if (plan.assetLimit === null) {
      return;
    }

    const currentAssetsCount = await assetRepository.count();

    if (currentAssetsCount >= plan.assetLimit) {
      throw new PlanLimitError(`Asset limit reached. Your plan allows up to ${plan.assetLimit} assets.`);
    }
  }
}

export const planLimitService = new PlanLimitService();
