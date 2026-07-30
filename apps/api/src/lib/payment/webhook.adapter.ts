export type PaymentEventType = 'PaymentSucceeded' | 'PaymentFailed' | 'PaymentRecovered';

export interface PaymentDomainEvent {
  /**
   * The type of the domain event.
   */
  type: PaymentEventType;
  /**
   * Global unique identifier from the provider (used for idempotency).
   */
  eventId: string;
  /**
   * The provider name (e.g., 'mock', 'midtrans').
   */
  provider: string;
  /**
   * The ID of the tenant this event belongs to.
   */
  tenantId: number;
  /**
   * Additional vendor-neutral payload data.
   */
  data: {
    planCode?: string;
    amount?: number;
    reason?: string;
  };
  /**
   * The raw, original payload for auditing.
   */
  rawPayload: Record<string, unknown>;
}

/**
 * Adapter that normalizes vendor-specific webhook payloads into internal domain events.
 */
export interface WebhookAdapter {
  /**
   * Verifies the signature of the incoming webhook.
   * Throws an error if invalid.
   */
  verifySignature(payload: string, signature: string): void;

  /**
   * Parses and normalizes the webhook payload into a domain event.
   * @param rawPayload The parsed JSON payload
   */
  normalizeEvent(rawPayload: Record<string, unknown>): PaymentDomainEvent;
}

/**
 * Mock Webhook Adapter implementation.
 * Used when PAYMENT_GATEWAY_DRIVER === 'mock'.
 */
export class MockWebhookAdapter implements WebhookAdapter {
  verifySignature(payload: string, signature: string): void {
    // For mock, any signature that says "mock_signature_valid" is valid.
    if (signature !== 'mock_signature_valid') {
      throw new Error('Invalid signature');
    }
  }

  normalizeEvent(rawPayload: Record<string, unknown>): PaymentDomainEvent {
    // Mock payload format expectation:
    // { event: 'success' | 'failed' | 'recovered', id: string, tenant_id: number, plan_code: string }
    const event = String(rawPayload.event);
    
    let type: PaymentEventType;
    switch (event) {
      case 'success':
        type = 'PaymentSucceeded';
        break;
      case 'failed':
        type = 'PaymentFailed';
        break;
      case 'recovered':
        type = 'PaymentRecovered';
        break;
      default:
        throw new Error(`Unknown event type: ${event}`);
    }

    if (!rawPayload.tenant_id) {
      throw new Error('Missing tenant_id in payload');
    }
    if (!rawPayload.id) {
      throw new Error('Missing event id in payload');
    }

    return {
      type,
      eventId: String(rawPayload.id),
      provider: 'mock',
      tenantId: Number(rawPayload.tenant_id),
      data: {
        planCode: rawPayload.plan_code ? String(rawPayload.plan_code) : undefined,
      },
      rawPayload,
    };
  }
}
