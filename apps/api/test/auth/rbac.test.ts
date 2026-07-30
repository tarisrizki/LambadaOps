import { describe, it, expect, vi } from 'vitest';
import { requireRole, requireAnyRole } from '../../src/middleware/rbac.middleware.js';
import { SystemRoles } from '../../src/lib/auth/roles.js';
import { ForbiddenError, UnauthorizedError } from '../../src/lib/errors.js';

describe('RBAC Foundation', () => {
  describe('requireRole', () => {
    it('should throw UnauthorizedError if user is not in context', async () => {
      const c = { get: vi.fn().mockReturnValue(undefined) } as any;
      const next = vi.fn();

      const middleware = requireRole(SystemRoles.OWNER_ADMIN);
      await expect(middleware(c, next)).rejects.toThrowError(UnauthorizedError);
      expect(next).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenError if user does not have the required role', async () => {
      const c = { get: vi.fn().mockReturnValue({ roleId: SystemRoles.EMPLOYEE }) } as any;
      const next = vi.fn();

      const middleware = requireRole(SystemRoles.OWNER_ADMIN);
      await expect(middleware(c, next)).rejects.toThrowError(ForbiddenError);
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next if user has the required role', async () => {
      const c = { get: vi.fn().mockReturnValue({ roleId: SystemRoles.OWNER_ADMIN }) } as any;
      const next = vi.fn();

      const middleware = requireRole(SystemRoles.OWNER_ADMIN);
      await middleware(c, next);
      
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireAnyRole', () => {
    it('should throw ForbiddenError if user has none of the allowed roles', async () => {
      const c = { get: vi.fn().mockReturnValue({ roleId: SystemRoles.EMPLOYEE }) } as any;
      const next = vi.fn();

      const middleware = requireAnyRole([SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER]);
      await expect(middleware(c, next)).rejects.toThrowError(ForbiddenError);
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next if user has one of the allowed roles', async () => {
      const c = { get: vi.fn().mockReturnValue({ roleId: SystemRoles.IT_MANAGER }) } as any;
      const next = vi.fn();

      const middleware = requireAnyRole([SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER]);
      await middleware(c, next);
      
      expect(next).toHaveBeenCalled();
    });
  });
});
