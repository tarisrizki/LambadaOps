import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registrationService } from '../../src/services/registration.service.js';
import { tenantRepository } from '../../src/repositories/tenant.repository.js';
import { globalUserRepository } from '../../src/repositories/user.repository.js';
import { subscriptionService } from '../../src/services/subscription.service.js';
import { ConflictError } from '../../src/lib/errors.js';
import { SystemRoles } from '../../src/lib/auth/roles.js';

// Mock dependencies
vi.mock('../../src/repositories/tenant.repository.js', () => ({
  tenantRepository: {
    findBySlug: vi.fn(),
    create: vi.fn(),
    deleteById: vi.fn(),
  },
}));

vi.mock('../../src/services/user-initialization.service.js', () => ({
  userInitializationService: {
    createOwner: vi.fn(),
  },
}));

vi.mock('../../src/repositories/user.repository.js', () => ({
  globalUserRepository: {
    deleteById: vi.fn(),
  },
}));

vi.mock('../../src/services/subscription.service.js', () => ({
  subscriptionService: {
    createTrialing: vi.fn(),
  },
}));

vi.mock('../../src/lib/auth/hash.js', () => ({
  hashPassword: vi.fn(async (pw) => `hashed_${pw}`),
}));

import { userInitializationService } from '../../src/services/user-initialization.service.js';

describe('RegistrationService', () => {
  const validInput = {
    companyName: 'Acme Corp',
    slug: 'acme-corp',
    adminName: 'Alice Admin',
    email: 'alice@acme.com',
    password: 'password123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates tenant, owner user, and trialing subscription', async () => {
    // Setup mocks for success path
    vi.mocked(tenantRepository.findBySlug).mockResolvedValue(null);
    vi.mocked(tenantRepository.create).mockResolvedValue({
      id: 1,
      name: 'Acme Corp',
      slug: 'acme-corp',
      trialEndsAt: new Date(),
    } as any);
    vi.mocked(userInitializationService.createOwner).mockResolvedValue({
      id: 10,
      email: 'alice@acme.com',
    } as any);
    vi.mocked(subscriptionService.createTrialing).mockResolvedValue({
      id: 100,
    } as any);

    const result = await registrationService.register(validInput);

    // Verify correct calls
    expect(tenantRepository.create).toHaveBeenCalledWith({
      name: 'Acme Corp',
      slug: 'acme-corp',
      trialEndsAt: expect.any(Date),
    });
    
    // User role should be OWNER_ADMIN and password should be hashed (handled internally by userInitializationService)
    expect(userInitializationService.createOwner).toHaveBeenCalledWith(1, {
      name: 'Alice Admin',
      email: 'alice@acme.com',
      password: 'password123',
    });

    // Subscription created with 'free'
    expect(subscriptionService.createTrialing).toHaveBeenCalledWith(1, 'free');

    // Return format
    expect(result).toEqual({
      tenant: {
        id: 1,
        slug: 'acme-corp',
        name: 'Acme Corp',
      },
      user: {
        id: 10,
        email: 'alice@acme.com',
      },
    });
  });

  it('throws ConflictError if slug is already taken (pre-check)', async () => {
    vi.mocked(tenantRepository.findBySlug).mockResolvedValue({ id: 1 } as any);

    await expect(registrationService.register(validInput)).rejects.toThrow(ConflictError);
    expect(tenantRepository.create).not.toHaveBeenCalled();
  });

  it('throws ConflictError and does not rollback if tenant creation throws unique constraint violation', async () => {
    vi.mocked(tenantRepository.findBySlug).mockResolvedValue(null);
    const uniqueErr = new Error('db error');
    // Ensure the cause chain matches how isUniqueViolation checks it
    (uniqueErr as any).cause = { code: '23505' };

    vi.mocked(tenantRepository.create).mockRejectedValue(uniqueErr);

    await expect(registrationService.register(validInput)).rejects.toThrow(ConflictError);
    expect(userInitializationService.createOwner).not.toHaveBeenCalled();
    expect(tenantRepository.deleteById).not.toHaveBeenCalled(); // No cleanup needed
  });

  it('rolls back tenant if user creation fails', async () => {
    vi.mocked(tenantRepository.findBySlug).mockResolvedValue(null);
    vi.mocked(tenantRepository.create).mockResolvedValue({ id: 1 } as any);
    
    const err = new Error('user creation failed');
    vi.mocked(userInitializationService.createOwner).mockRejectedValue(err);

    await expect(registrationService.register(validInput)).rejects.toThrow('user creation failed');
    
    expect(tenantRepository.deleteById).toHaveBeenCalledWith(1);
    expect(subscriptionService.createTrialing).not.toHaveBeenCalled();
  });

  it('rolls back user and tenant if subscription creation fails', async () => {
    vi.mocked(tenantRepository.findBySlug).mockResolvedValue(null);
    vi.mocked(tenantRepository.create).mockResolvedValue({ id: 1 } as any);
    vi.mocked(userInitializationService.createOwner).mockResolvedValue({ id: 10 } as any);
    
    const err = new Error('subscription creation failed');
    vi.mocked(subscriptionService.createTrialing).mockRejectedValue(err);

    await expect(registrationService.register(validInput)).rejects.toThrow('subscription creation failed');
    
    // Deletes in reverse order
    expect(globalUserRepository.deleteById).toHaveBeenCalledWith(10);
    expect(tenantRepository.deleteById).toHaveBeenCalledWith(1);
  });
});
