import { randomUUID } from 'node:crypto';
import type { PaymentGatewayInterface, CreateCheckoutSessionInput, CreateCheckoutSessionOutput } from './payment.interface.js';
import { getEnv } from '../env.js';

/**
 * Mock implementation of the PaymentGatewayInterface for MVP and local development.
 * Instead of calling an external provider like Midtrans or Xendit, it generates
 * a fake session ID and returns a URL pointing to the local frontend's mock payment page.
 */
export class MockPaymentGateway implements PaymentGatewayInterface {
  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionOutput> {
    const sessionId = `mock_sess_${randomUUID()}`;
    const frontendUrl = getEnv().FRONTEND_URL;
    
    // In a real system, this would be a URL to the provider's hosted checkout page.
    // For our mock, we point back to our frontend (which will have a dev-only page to simulate payment success).
    const checkoutUrl = `${frontendUrl}/mock-payment?session_id=${sessionId}&tenant_id=${input.tenantId}&plan=${input.planCode}&success_url=${encodeURIComponent(input.successUrl)}&cancel_url=${encodeURIComponent(input.cancelUrl)}`;
    
    return {
      checkoutUrl,
      sessionId,
    };
  }
}
