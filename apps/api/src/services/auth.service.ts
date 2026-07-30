import { globalUserRepository } from '../repositories/user.repository.js';
import { tenantRepository } from '../repositories/tenant.repository.js';
import { verifyPassword } from '../lib/auth/hash.js';
import { generateAccessToken } from '../lib/auth/jwt.js';
import { InvalidCredentialsError } from '../lib/errors.js';
import { z } from 'zod';

/**
 * FEATURE_SPEC §1.2 — Login requires company_slug (tenant identifier).
 * Email is unique per-tenant, not globally.
 * Login without company_slug would allow cross-tenant credential attacks.
 */
export const loginSchema = z.object({
  companySlug: z.string().min(1, 'Company slug is required'),
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof loginSchema>;

export class AuthService {
  /**
   * Authenticates a user by company_slug + email + password.
   *
   * SPEC §1.2:
   *  1. Resolve tenant from company_slug.
   *  2. Find user by email within that tenant only.
   *  3. Verify password.
   *  4. Generate JWT containing tenantId and roleId.
   */
  async login({ companySlug, email, password }: LoginInput) {
    // 1. Resolve tenant — fail silently with same error to avoid enumeration
    const tenant = await tenantRepository.findBySlug(companySlug);
    if (!tenant) {
      throw new InvalidCredentialsError();
    }

    // 2. Find user within this tenant only (not global)
    const user = await globalUserRepository.findByEmailInTenant(email, tenant.id);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    // 3. Verify password
    const isValid = await verifyPassword(user.password, password);
    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    // 4. Generate token
    const token = await generateAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      roleId: user.roleId,
    });

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
      }
    };
  }
}

export const authService = new AuthService();
