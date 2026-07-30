import { globalUserRepository } from '../repositories/user.repository.js';
import { hashPassword } from '../lib/auth/hash.js';
import { SystemRoles } from '../lib/auth/roles.js';

export type CreateOwnerInput = {
  name: string;
  email: string;
  password: string;
};

/**
 * Owns the knowledge of what constitutes an "initial tenant owner".
 *
 * ARCHITECTURAL RULE:
 *   This is the ONLY service in the system permitted to reference SystemRoles.OWNER_ADMIN.
 *   RegistrationService must delegate owner creation here — it must not embed role constants.
 *   Future user management services that create users with other roles must reference
 *   their respective SystemRoles constants in their own layer.
 */
export class UserInitializationService {
  /**
   * Creates the first (owner) user for a new tenant.
   *
   * Automatically assigns SystemRoles.OWNER_ADMIN.
   * Hashes the password before storage — plaintext never reaches the repository.
   *
   * @param tenantId - The newly created tenant's ID
   * @param data - Owner credentials and name
   */
  async createOwner(tenantId: number, data: CreateOwnerInput) {
    const hashedPassword = await hashPassword(data.password);

    return globalUserRepository.createWithTenant({
      tenantId,
      name: data.name,
      email: data.email,
      password: hashedPassword,
      roleId: SystemRoles.OWNER_ADMIN, // Only allowed reference to OWNER_ADMIN
    });
  }
}

export const userInitializationService = new UserInitializationService();
