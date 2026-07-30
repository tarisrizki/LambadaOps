import { eq, and, desc, lt, inArray } from 'drizzle-orm';
import { assetEvents } from '../db/schema/asset.schema.js';
import { TenantRepository } from './base.repository.js';
import { db } from '../db/index.js';

export type CreateAssetEventParams = typeof assetEvents.$inferInsert;
export type AssetEventType = (typeof assetEvents.$inferSelect)['eventType'];
export type AssetEventCategory = (typeof assetEvents.$inferSelect)['category'];
export type AssetEventSeverity = (typeof assetEvents.$inferSelect)['severity'];

export type TimelineFilters = {
  assetId?: number;
  category?: (typeof assetEvents.$inferSelect)['category'][];
  severity?: (typeof assetEvents.$inferSelect)['severity'][];
  actorUserId?: number;
  limit?: number;
  cursor?: number; // using id as cursor
};

export class EventRepository extends TenantRepository {
  /**
   * Only INSERT operation is allowed for Asset Events.
   */
  async create(data: CreateAssetEventParams): Promise<typeof assetEvents.$inferSelect> {
    const dbClient = this.txSession || db;
    const [event] = await dbClient.insert(assetEvents).values(data).returning();
    return event;
  }

  /**
   * Retrieves the timeline of events based on filters and cursor.
   */
  async getTimeline(filters: TimelineFilters = {}) {
    const dbClient = this.txSession || db;
    
    const conditions = [eq(assetEvents.tenantId, this.tenantId)];

    if (filters.assetId) {
      conditions.push(eq(assetEvents.assetId, filters.assetId));
    }
    
    if (filters.category && filters.category.length > 0) {
      conditions.push(inArray(assetEvents.category, filters.category));
    }

    if (filters.severity && filters.severity.length > 0) {
      conditions.push(inArray(assetEvents.severity, filters.severity));
    }

    if (filters.actorUserId) {
      conditions.push(eq(assetEvents.actorUserId, filters.actorUserId));
    }

    if (filters.cursor) {
      conditions.push(lt(assetEvents.id, filters.cursor));
    }

    const limit = filters.limit || 50;

    const events = await dbClient.query.assetEvents.findMany({
      where: and(...conditions),
      orderBy: [desc(assetEvents.id)],
      limit: limit + 1, // fetch one extra to determine if there's a next page
    });

    const hasNextPage = events.length > limit;
    const data = hasNextPage ? events.slice(0, limit) : events;
    const nextCursor = hasNextPage ? data[data.length - 1].id : null;

    return {
      data,
      nextCursor,
    };
  }
}

// Since EventRepository extends TenantRepository, it is usually instantiated per request.
// Or we can just use `TenantContext` in the service.
// Let's rely on TenantContext injection in the TenantRepository constructor when no tenantId is passed.
export const eventRepository = new EventRepository();
