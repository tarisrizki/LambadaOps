import { auditRepository } from '../repositories/audit.repository.js';
import { eventRepository, type TimelineFilters } from '../repositories/event.repository.js';
import { assetEvents } from '../db/schema/asset.schema.js';
import { TenantContext } from '../lib/tenant-context.js';

export type LogAuditParams = {
  entityType: string;
  entityId: string;
  action: string;
  oldValue: any;
  newValue: any;
  actorId?: number;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  correlationId?: string;
};

export type LogEventParams = {
  assetId: number;
  eventType: (typeof assetEvents.$inferSelect)['eventType'];
  category: (typeof assetEvents.$inferSelect)['category'];
  severity: (typeof assetEvents.$inferSelect)['severity'];
  oldValue: any;
  newValue: any;
  actorUserId: number;
  actorNameSnapshot: string;
  note?: string;
  requestId?: string;
  correlationId?: string;
};

export class ActivityService {
  /**
   * Logs a system-level audit record synchronously within a transaction.
   */
  async logAudit(params: LogAuditParams, txSession: any) {
    const tenantId = TenantContext.getTenantId();
    const auditRepoTx = auditRepository.withTx(txSession);
    
    return await auditRepoTx.create({
      tenantId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      oldValue: params.oldValue,
      newValue: params.newValue,
      actorId: params.actorId || null,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
      requestId: params.requestId || null,
      correlationId: params.correlationId || null,
    });
  }

  /**
   * Logs a business timeline event synchronously within a transaction.
   */
  async logEvent(params: LogEventParams, txSession: any) {
    const tenantId = TenantContext.getTenantId();
    const eventRepoTx = eventRepository.withTx(txSession);

    return await eventRepoTx.create({
      tenantId,
      assetId: params.assetId,
      eventType: params.eventType,
      category: params.category,
      severity: params.severity,
      oldValue: params.oldValue,
      newValue: params.newValue,
      actorUserId: params.actorUserId,
      actorNameSnapshot: params.actorNameSnapshot,
      note: params.note || null,
      requestId: params.requestId || null,
      correlationId: params.correlationId || null,
    });
  }

  /**
   * Retrieves the activity timeline for the current tenant, optionally filtered.
   */
  async getTimeline(filters: TimelineFilters) {
    // Tenant filtering is automatically handled by the repository
    return await eventRepository.getTimeline(filters);
  }
}

export const activityService = new ActivityService();
