import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { webhookRoutes } from '../../src/routes/webhook.routes.js';
import { subscriptionService } from '../../src/services/subscription.service.js';
import { webhookLogRepository } from '../../src/repositories/webhook-log.repository.js';
import * as envModule from '../../src/lib/env.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Mock dependencies
vi.mock('../../src/lib/env.js', () => ({
  getEnv: vi.fn().mockReturnValue({
    PAYMENT_GATEWAY_DRIVER: 'mock',
  }),
}));

vi.mock('../../src/services/subscription.service.js', () => ({
  subscriptionService: {
    processWebhookEvent: vi.fn(),
  },
}));

vi.mock('../../src/repositories/webhook-log.repository.js', () => ({
  webhookLogRepository: {
    findByEventId: vi.fn(),
    create: vi.fn(),
    markProcessed: vi.fn(),
  },
}));

describe('Webhook Processing Pipeline', () => {
  const app = new Hono();
  app.route('/webhooks', webhookRoutes);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Webhook Route & Adapter', () => {
    it('returns 401 for invalid signature', async () => {
      const res = await app.request('/webhooks/payment', {
        method: 'POST',
        headers: {
          'x-signature': 'invalid_sig',
        },
        body: JSON.stringify({ event: 'success', id: 'evt_1', tenant_id: 1 }),
      });

      expect(res.status).toBe(401);
      expect(subscriptionService.processWebhookEvent).not.toHaveBeenCalled();
    });

    it('returns 400 for malformed payload', async () => {
      const res = await app.request('/webhooks/payment', {
        method: 'POST',
        headers: {
          'x-signature': 'mock_signature_valid',
        },
        body: '{ bad json }',
      });

      expect(res.status).toBe(400);
      expect(subscriptionService.processWebhookEvent).not.toHaveBeenCalled();
    });

    it('returns 400 if normalization fails (missing tenant_id)', async () => {
      const res = await app.request('/webhooks/payment', {
        method: 'POST',
        headers: {
          'x-signature': 'mock_signature_valid',
        },
        body: JSON.stringify({ event: 'success', id: 'evt_1' }),
      });

      expect(res.status).toBe(400);
      expect(subscriptionService.processWebhookEvent).not.toHaveBeenCalled();
    });

    it('delegates to SubscriptionService when payload is valid', async () => {
      vi.mocked(subscriptionService.processWebhookEvent).mockResolvedValue();

      const res = await app.request('/webhooks/payment', {
        method: 'POST',
        headers: {
          'x-signature': 'mock_signature_valid',
        },
        body: JSON.stringify({ event: 'success', id: 'evt_1', tenant_id: 42, plan_code: 'pro' }),
      });

      expect(res.status).toBe(200);
      expect(subscriptionService.processWebhookEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'PaymentSucceeded',
          eventId: 'evt_1',
          tenantId: 42,
          data: { planCode: 'pro' },
        })
      );
    });

    it('returns 200 if SubscriptionService throws a BusinessRuleError (e.g. invalid transition)', async () => {
      const { BusinessRuleError } = await import('../../src/lib/errors.js');
      vi.mocked(subscriptionService.processWebhookEvent).mockRejectedValue(new BusinessRuleError('Invalid'));

      const res = await app.request('/webhooks/payment', {
        method: 'POST',
        headers: {
          'x-signature': 'mock_signature_valid',
        },
        body: JSON.stringify({ event: 'success', id: 'evt_1', tenant_id: 42 }),
      });

      // Still returns 200 to acknowledge the webhook, even though business rule failed
      expect(res.status).toBe(200);
    });
  });

  describe('Boundary Audit', () => {
    it('webhook.routes.ts does not import database schema or drizzle', () => {
      const filePath = resolve(process.cwd(), 'src/routes/webhook.routes.ts');
      const content = readFileSync(filePath, 'utf-8');
      
      expect(content).not.toMatch(/drizzle-orm/);
      expect(content).not.toMatch(/db\/schema/);
    });
  });
});
