import { eq, and } from 'drizzle-orm';
import { webhookLogs } from '../db/schema/billing.schema.js';
import { GlobalRepository } from './base.repository.js';

export type CreateWebhookLogInput = typeof webhookLogs.$inferInsert;
export type WebhookLog = typeof webhookLogs.$inferSelect;

/**
 * Handles operations for webhook_logs table.
 * Used exclusively for idempotency guards.
 * Uses GlobalRepository because webhooks are pre-auth/system-level events.
 */
export class WebhookLogRepository extends GlobalRepository {
  /**
   * Finds a webhook log by provider and event ID.
   * Used to check if an event has already been received/processed.
   */
  async findByEventId(provider: string, eventId: string): Promise<WebhookLog | null> {
    const result = await this.db
      .select()
      .from(webhookLogs)
      .where(
        and(
          eq(webhookLogs.provider, provider),
          eq(webhookLogs.eventId, eventId)
        )
      )
      .limit(1);

    return result[0] ?? null;
  }

  /**
   * Logs a new webhook event.
   */
  async create(data: CreateWebhookLogInput): Promise<WebhookLog> {
    const result = await this.db
      .insert(webhookLogs)
      .values(data)
      .returning();

    return result[0]!;
  }

  /**
   * Marks a webhook event as successfully processed.
   */
  async markProcessed(id: number): Promise<void> {
    await this.db
      .update(webhookLogs)
      .set({ processedAt: new Date() })
      .where(eq(webhookLogs.id, id));
  }
}

export const webhookLogRepository = new WebhookLogRepository();
