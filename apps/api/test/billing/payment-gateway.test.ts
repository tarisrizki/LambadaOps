import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPaymentGateway } from '../../src/lib/payment/index.js';
import { MockPaymentGateway } from '../../src/lib/payment/mock.driver.js';
import * as envModule from '../../src/lib/env.js';

vi.mock('../../src/lib/env.js', () => ({
  getEnv: vi.fn(),
}));

describe('Payment Gateway Abstraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('resolves MockPaymentGateway when env is set to mock', async () => {
    vi.mocked(envModule.getEnv).mockReturnValue({
      PAYMENT_GATEWAY_DRIVER: 'mock',
      FRONTEND_URL: 'http://localhost:3001',
    } as any);

    const gateway = getPaymentGateway();
    
    expect(gateway).toBeInstanceOf(MockPaymentGateway);
  });

  it('throws an error when env is set to midtrans (not implemented)', async () => {
    // Reset the internal cached gateway instance so it re-evaluates
    // Note: since it's a singleton in the module scope, we can import it fresh by isolating the module
    // if needed. Let's just rely on a helper to reset or we can dynamically import.
    // Vitest vi.resetModules() handles this for dynamic imports.
    vi.mocked(envModule.getEnv).mockReturnValue({
      PAYMENT_GATEWAY_DRIVER: 'midtrans',
    } as any);

    const module = await import('../../src/lib/payment/index.js?bust1');
    
    expect(() => module.getPaymentGateway()).toThrow(/not implemented yet/);
  });

  it('throws an error when env is set to xendit (not implemented)', async () => {
    vi.mocked(envModule.getEnv).mockReturnValue({
      PAYMENT_GATEWAY_DRIVER: 'xendit',
    } as any);

    const module = await import('../../src/lib/payment/index.js?bust2');
    
    expect(() => module.getPaymentGateway()).toThrow(/not implemented yet/);
  });

  describe('MockPaymentGateway', () => {
    it('generates a valid checkout session pointing to local frontend', async () => {
      vi.mocked(envModule.getEnv).mockReturnValue({
        FRONTEND_URL: 'http://localhost:3001',
      } as any);

      const gateway = new MockPaymentGateway();
      
      const result = await gateway.createCheckoutSession({
        tenantId: 42,
        planCode: 'pro',
        amount: 299000,
        successUrl: 'http://localhost:3001/success',
        cancelUrl: 'http://localhost:3001/cancel',
      });

      expect(result.sessionId).toMatch(/^mock_sess_/);
      expect(result.checkoutUrl).toContain('http://localhost:3001/mock-payment');
      expect(result.checkoutUrl).toContain('session_id=mock_sess_');
      expect(result.checkoutUrl).toContain('tenant_id=42');
      expect(result.checkoutUrl).toContain('plan=pro');
      expect(result.checkoutUrl).toContain('success_url=http%3A%2F%2Flocalhost%3A3001%2Fsuccess');
    });
  });
});
