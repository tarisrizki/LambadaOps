import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/lib/auth/hash.js';
import { generateAccessToken, verifyAccessToken } from '../../src/lib/auth/jwt.js';
import { authMiddleware } from '../../src/middleware/auth.middleware.js';
import { TenantContext } from '../../src/lib/tenant-context.js';
import { UnauthorizedError } from '../../src/lib/errors.js';

// Mock env so JWT secret is consistent
vi.mock('../../src/lib/env.js', () => ({
  getEnv: () => ({
    JWT_SECRET: 'test_secret_must_be_32_chars_long_123',
    JWT_EXPIRES_IN: '15m',
  })
}));

describe('Auth Foundation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Hash Utilities', () => {
    it('should hash and verify passwords correctly', async () => {
      const password = 'mySuperSecretPassword123';
      const hash = await hashPassword(password);
      
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$argon2')).toBe(true);
      
      const isValid = await verifyPassword(hash, password);
      expect(isValid).toBe(true);
      
      const isInvalid = await verifyPassword(hash, 'wrongPassword');
      expect(isInvalid).toBe(false);
    });
  });

  describe('JWT Utilities', () => {
    it('should sign and verify valid claims', async () => {
      const claims = { userId: 1, tenantId: 2, roleId: 3 };
      
      const token = await generateAccessToken(claims);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
      
      const decoded = await verifyAccessToken(token);
      expect(decoded.userId).toBe(claims.userId);
      expect(decoded.tenantId).toBe(claims.tenantId);
      expect(decoded.roleId).toBe(claims.roleId);
    });

    it('should throw on invalid tokens', async () => {
      await expect(verifyAccessToken('invalid.token.string')).rejects.toThrow();
    });
  });

  describe('Auth Middleware', () => {
    it('should throw UnauthorizedError if no header is present', async () => {
      const c = { req: { header: () => undefined } } as any;
      const next = vi.fn();

      await expect(authMiddleware(c, next)).rejects.toThrowError(UnauthorizedError);
      expect(next).not.toHaveBeenCalled();
    });

    it('should decode JWT exactly once, set context, and call next() wrapped in TenantContext', async () => {
      const claims = { userId: 1, tenantId: 99, roleId: 3 };
      const token = await generateAccessToken(claims);
      
      const c = { 
        req: { header: () => `Bearer ${token}` },
        set: vi.fn(),
      } as any;
      
      let tenantIdInsideNext: number | undefined;
      const next = vi.fn(async () => {
        tenantIdInsideNext = TenantContext.getTenantId();
      });

      await authMiddleware(c, next);

      expect(c.set).toHaveBeenCalledWith('user', expect.objectContaining({ tenantId: 99 }));
      expect(next).toHaveBeenCalled();
      expect(tenantIdInsideNext).toBe(99);
    });
  });
});
