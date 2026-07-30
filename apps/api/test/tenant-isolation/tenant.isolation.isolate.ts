import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { TenantContext } from '../../src/lib/tenant-context.js';
import { userRepository } from '../../src/repositories/user.repository.js';
import { db } from '../../src/db/index.js';
import { users } from '../../src/db/schema/user.schema.js';
import { tenants } from '../../src/db/schema/tenant.schema.js';
import { eq } from 'drizzle-orm';

describe('Tenant Isolation Layer 1 & 2', () => {
  let testTenantId: number;
  let testUserId: number;

  beforeEach(async () => {
    // Create a real tenant for the test
    const tenantResult = await db.insert(tenants).values({
      name: `Isolation Test Tenant ${Math.random().toString(16).slice(2, 10)}`,
      slug: `iso-tenant-${Math.random().toString(16).slice(2, 10)}`,
    }).returning({ id: tenants.id });
    testTenantId = tenantResult[0]!.id;

    // Create a real user manually for access test
    const userResult = await db.insert(users).values({
      tenantId: testTenantId,
      name: 'Isolation Test User',
      email: `iso-test-${Math.random().toString(16).slice(2, 10)}@example.com`,
      password: 'hashed',
      roleId: 1,
      status: 'active'
    }).returning({ id: users.id });
    testUserId = userResult[0]!.id;
  });

  afterAll(async () => {
    vi.resetModules();
  });

  describe('TenantContext access', () => {
    it('should throw an error when accessing tenant repository without context', async () => {
      // Act & Assert
      await expect(userRepository.findById(testUserId)).rejects.toThrow(
        '[TenantContext] No tenant context found in the current async scope.'
      );
    });

    it('should succeed when accessing tenant repository inside context', async () => {
      // Act & Assert
      await TenantContext.run({ tenantId: testTenantId }, async () => {
        const result = await userRepository.findById(testUserId);
        expect(result).not.toBeNull();
        expect(result!.id).toBe(testUserId);
      });
    });
  });

  describe('Data Insertion', () => {
    it('should auto-inject tenantId on create from context, ignoring provided tenantId', async () => {
      // Arrange
      const maliciousTenantId = 99999;
      
      await TenantContext.run({ tenantId: testTenantId }, async () => {
        // Act
        // Pass a rogue tenantId to see if the repository overrides it
        const newUser = await userRepository.create({
          name: 'Malicious User',
          email: `malicious-${Math.random().toString(16).slice(2, 10)}@example.com`,
          password: 'hashed',
          roleId: 1,
          status: 'active',
          // @ts-expect-error - testing malicious injection
          tenantId: maliciousTenantId,
        });

        // Assert
        expect(newUser.tenantId).toBe(testTenantId); // Should be the context's tenantId
        expect(newUser.tenantId).not.toBe(maliciousTenantId); // Should NOT be the injected one
      });
    });
  });
});

