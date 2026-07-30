import { Hono } from 'hono';
import { getWebhookAdapter } from '../lib/payment/index.js';
import { subscriptionService } from '../services/subscription.service.js';
import { maintenanceService } from '../services/maintenance.service.js';
import { assetService } from '../services/asset.service.js';
import { tenantRepository } from '../repositories/tenant.repository.js';

export const webhookRoutes = new Hono();

/**
 * POST /api/webhooks/payment
 * 
 * Domain Event Entrypoint for all payment gateway events.
 * Bypasses normal authentication (uses signature verification).
 */
webhookRoutes.post('/payment', async (c) => {
  const adapter = getWebhookAdapter();
  
  // 1. Authenticate / Verify Signature
  // In a real implementation, the signature header name varies (e.g. x-callback-token, stripe-signature)
  // For the mock, we just use a generic 'x-signature' header.
  const signature = c.req.header('x-signature') ?? '';
  
  // We need the raw body as a string for true signature verification in many providers.
  // For the mock, we just pass the text.
  const rawBodyText = await c.req.text();
  
  try {
    adapter.verifySignature(rawBodyText, signature);
  } catch {
    console.warn('[WEBHOOK] Invalid signature detected');
    // Reject unauthorized webhooks
    return c.json({ error: 'Invalid signature' }, 401);
  }

  // 2. Parse Payload
  let rawPayload: Record<string, unknown>;
  try {
    rawPayload = JSON.parse(rawBodyText);
  } catch {
    return c.json({ error: 'Malformed JSON payload' }, 400);
  }

  // 3. Normalize into Domain Event
  let domainEvent;
  try {
    domainEvent = adapter.normalizeEvent(rawPayload);
  } catch (err) {
    // If normalization fails (e.g., missing tenant_id in mock), it's a bad payload.
    // Return 200 to prevent retries for fundamentally unprocessable data, or 400 if it's considered client error.
    console.error('[WEBHOOK] Normalization failed:', err);
    return c.json({ error: 'Normalization failed' }, 400);
  }

  // 4. Delegate to SubscriptionService
  try {
    await subscriptionService.processWebhookEvent(domainEvent);
  } catch (err) {
    // Handle business rule rejections (e.g. invalid state transition)
    // We return 200 OK so the webhook doesn't retry an impossible transition,
    // but we log the error.
    console.error(`[WEBHOOK] Business rule rejection for event ${domainEvent.eventId}:`, err);
    return c.json({ message: 'Event ignored due to business rules' }, 200);
  }

  return c.json({ message: 'Processed successfully' }, 200);
});

/**
 * POST /api/webhooks/cron/daily
 * 
 * Triggered by external cron scheduler (e.g., Vercel Cron).
 * It will run background jobs across all tenants (e.g., maintenance due notifications).
 */
webhookRoutes.post('/cron/daily', async (c) => {
  // Simple auth for cron (in real life use Authorization Bearer with a secure cron secret)
  const cronSecret = c.req.header('authorization')?.replace('Bearer ', '');
  if (cronSecret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const tenants = await tenantRepository.findAllActiveTenants();
    
    let totalMaintenanceNotified = 0;
    let totalWarrantyNotified = 0;
    
    // Process each tenant (sequentially to avoid spiking DB connections, or Promise.allSettled)
    for (const tenant of tenants) {
      const maintenanceRes = await maintenanceService.triggerDueNotifications(tenant.id);
      totalMaintenanceNotified += maintenanceRes.notifiedCount;
      
      const warrantyRes = await assetService.triggerWarrantyNotifications(tenant.id);
      totalWarrantyNotified += warrantyRes.notifiedCount;
    }

    return c.json({ 
      status: 'success', 
      maintenanceNotified: totalMaintenanceNotified,
      warrantyNotified: totalWarrantyNotified
    }, 200);
  } catch (error) {
    console.error('[CRON] Daily job failed:', error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});
