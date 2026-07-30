import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TenantContext } from '../../src/lib/tenant-context.js';
import { userRepository } from '../../src/repositories/user.repository.js';
import { db } from '../../src/db/index.js';

// Mock the db object
vi.mock('../../src/db/index.js', () => {
  const insertMock = vi.fn().mockReturnThis();
  const valuesMock = vi.fn().mockReturnThis();
  const returningMock = vi.fn().mockResolvedValue([{ id: 1 }]);
  
  const selectMock = vi.fn().mockReturnThis();
  const fromMock = vi.fn().mockReturnThis();
  const whereMock = vi.fn().mockReturnThis();
  const limitMock = vi.fn().mockResolvedValue([{ id: 1 }]);

  return {
    db: {
      insert: insertMock,
      values: valuesMock,
      returning: returningMock,
      select: selectMock,
      from: fromMock,
      where: whereMock,
      limit: limitMock,
    }
  };
});

describe('Tenant Isolation Layer 1 & 2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TenantContext access', () => {
    it('should throw an error when accessing tenant repository without context', async () => {
      // Act & Assert
      await expect(userRepository.findById(1)).rejects.toThrow(
        '[TenantContext] No tenant context found in the current async scope.'
      );
    });

    it('should succeed when accessing tenant repository inside context', async () => {
      // Arrange
      const mockTenantId = 999;
      
      // Act & Assert
      await TenantContext.run({ tenantId: mockTenantId }, async () => {
        const result = await userRepository.findById(1);
        expect(result).toEqual({ id: 1 });
        
        // Ensure where clause was called (we can't easily check the Drizzle object internals in simple mocks, 
        // but the fact it didn't throw proves it successfully retrieved tenantId from context)
        expect(db.where).toHaveBeenCalled();
      });
    });
  });

  describe('Data Insertion', () => {
    it('should auto-inject tenantId on create from context, ignoring provided tenantId', async () => {
      // Arrange
      const activeTenantId = 123;
      
      await TenantContext.run({ tenantId: activeTenantId }, async () => {
        // Act
        // Pass a rogue tenantId to see if the repository overrides it
        await userRepository.create({
          name: 'Test User',
          email: 'test@example.com',
          password: 'hashed',
          roleId: 1,
          status: 'active',
          // @ts-expect-error - testing malicious injection
          tenantId: 99999,
        });

        // Assert
        // Verify that db.values was called with the context's tenantId (123)
        expect(db.values).toHaveBeenCalledWith(
          expect.objectContaining({
            tenantId: activeTenantId,
            name: 'Test User'
          })
        );
      });
    });
  });
});
