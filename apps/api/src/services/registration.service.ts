import { tenantRepository } from '../repositories/tenant.repository.js';
import { globalUserRepository } from '../repositories/user.repository.js';
import { subscriptionService } from './subscription.service.js';
import { userInitializationService } from './user-initialization.service.js';
import { ConflictError } from '../lib/errors.js';
import { isUniqueViolation } from '../lib/db-errors.js';
import type { RegisterInput } from '../schemas/registration.schema.js';

export type RegisterResult = {
  tenant: {
    id: number;
    slug: string;
    name: string;
  };
  user: {
    id: number;
    email: string;
  };
};

/**
 * Orchestrates the tenant registration flow.
 *
 * Implements a compensating rollback pattern to prevent partial state if
 * any step of the multi-entity creation process fails.
 */
export class RegistrationService {
  async register(input: RegisterInput): Promise<RegisterResult> {
    const { companyName, slug, adminName, email, password } = input;

    // We do a pre-flight uniqueness check, though the DB unique constraint
    // is the ultimate authority.
    const existing = await tenantRepository.findBySlug(slug);
    if (existing) {
      throw new ConflictError('Slug already taken');
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    let tenantId: number | undefined;
    let userId: number | undefined;

    // ─── Step 1: Create Tenant ───────────────────────────────────────────────
    try {
      const tenant = await tenantRepository.create({
        name: companyName,
        slug,
        trialEndsAt,
      });
      tenantId = tenant.id;
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictError('Slug already taken');
      }
      throw err;
    }

    // ─── Step 2: Create Owner User ───────────────────────────────────────────
    try {
      const user = await userInitializationService.createOwner(tenantId!, {
        name: adminName,
        email,
        password,
      });
      userId = user.id;
    } catch (err) {
      // Rollback tenant
      try {
        await tenantRepository.deleteById(tenantId!);
      } catch (rollbackErr) {
        console.error(
          '[CRITICAL] Registration rollback failed. Manual recovery needed.',
          {
            registrationId: `tenant_${tenantId}`,
            tenantId,
            error: rollbackErr,
          }
        );
      }
      // If unique violation on email
      if (isUniqueViolation(err)) {
        throw new ConflictError('Email already registered');
      }
      throw err;
    }

    // ─── Step 3: Create Trialing Subscription ────────────────────────────────
    try {
      await subscriptionService.createTrialing(tenantId!, 'free');
    } catch (err) {
      // Rollback user and tenant
      try {
        await globalUserRepository.deleteById(userId!);
        await tenantRepository.deleteById(tenantId!);
      } catch (rollbackErr) {
        console.error(
          '[CRITICAL] Registration rollback failed. Manual recovery needed.',
          {
            registrationId: `tenant_${tenantId}_user_${userId}`,
            tenantId,
            userId,
            error: rollbackErr,
          }
        );
      }
      throw err;
    }

    return {
      tenant: {
        id: tenantId!,
        slug,
        name: companyName,
      },
      user: {
        id: userId!,
        email,
      },
    };
  }
}

export const registrationService = new RegistrationService();
