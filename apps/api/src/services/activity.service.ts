import { auditRepository } from '../repositories/audit.repository.js';
import { eventRepository, type TimelineFilters, type AssetEventType, type AssetEventCategory, type AssetEventSeverity } from '../repositories/event.repository.js';
import { TenantContext } from '../lib/tenant-context.js';

export type LogAuditParams = {
  entityType: string;
  entityId: string;
  action: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  actorId?: number;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  correlationId?: string;
};

export type LogEventParams = {
  assetId: number;
  eventType: AssetEventType;
  category: AssetEventCategory;
  severity: AssetEventSeverity;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
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
  async logAudit(params: LogAuditParams, txSession: unknown) {
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
  async logEvent(params: LogEventParams, txSession: unknown) {
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
