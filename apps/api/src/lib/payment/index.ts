import { getEnv } from '../env.js';
import { MockPaymentGateway } from './mock.driver.js';
import { MockWebhookAdapter, type WebhookAdapter } from './webhook.adapter.js';
import type { PaymentGatewayInterface } from './payment.interface.js';

let _paymentGateway: PaymentGatewayInterface | null = null;

export function getPaymentGateway(): PaymentGatewayInterface {
  if (_paymentGateway) {
    return _paymentGateway;
  }

  const driver = getEnv().PAYMENT_GATEWAY_DRIVER;

  if (driver === 'mock') {
    _paymentGateway = new MockPaymentGateway();
  } else if (driver === 'midtrans' || driver === 'xendit') {
    throw new Error(`Payment gateway driver '${driver}' is not implemented yet.`);
  } else {
    // Fallback for typesafety, though Zod validation in env.ts should prevent this
    throw new Error(`Unknown payment gateway driver: ${driver}`);
  }

  return _paymentGateway;
}

let _webhookAdapter: WebhookAdapter | null = null;

export function getWebhookAdapter(): WebhookAdapter {
  if (_webhookAdapter) {
    return _webhookAdapter;
  }

  const driver = getEnv().PAYMENT_GATEWAY_DRIVER;

  if (driver === 'mock') {
    _webhookAdapter = new MockWebhookAdapter();
  } else if (driver === 'midtrans' || driver === 'xendit') {
    throw new Error(`Webhook adapter for driver '${driver}' is not implemented yet.`);
  } else {
    throw new Error(`Unknown payment gateway driver: ${driver}`);
  }

  return _webhookAdapter;
}

export * from './payment.interface.js';
export * from './webhook.adapter.js';
