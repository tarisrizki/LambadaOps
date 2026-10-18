import { and, desc, eq, gte, lt, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  assets,
  maintenanceRecords,
  tickets,
  users,
} from '../db/schema/index.js';
import { HTTPException } from '../lib/errors';

/**
 * Build a typed WHERE clause from a base condition set + optional filters.
 * Drizzle's `and()` expects at least 2 conditions; fall back to the single
 * condition when only one is provided.
 */
function buildWhere(conditions: Array<ReturnType<typeof eq> | ReturnType<typeof gte> | ReturnType<typeof lt>>) {
  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return and(...conditions);
}

export class DashboardService {
  // ─── Dashboard Stats ───────────────────────────────────────────────────────────────

  async getDashboardStats(
    companyId: string,
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user.length === 0 || user[0].companyId !== companyId) {
        throw new HTTPException(403, { message: 'Access denied to this company' });
      }

      const baseConditions: Array<ReturnType<typeof eq> | ReturnType<typeof gte> | ReturnType<typeof lt>> = [
        eq(assets.companyId, companyId),
        eq(assets.tenantId, user[0].tenantId || ''),
      ];
      if (startDate) baseConditions.push(gte(assets.createdAt, startDate));
      if (endDate) baseConditions.push(lt(assets.createdAt, endDate));
      const whereClause = buildWhere(baseConditions);

      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);

      const totalAssets = await db.select({ count: sql`COUNT(*)` }).from(assets).where(whereClause);
      const activeAssets = await db.select({ count: sql`COUNT(*)` }).from(assets).where(
        and(whereClause, eq(assets.status, 'active')),
      );
      const assetsUnderMaintenance = await db.select({ count: sql`COUNT(*)` }).from(assets).where(
        and(whereClause, eq(assets.status, 'maintenance')),
      );
      const totalTickets = await db.select({ count: sql`COUNT(*)` }).from(tickets).where(whereClause);
      const openTickets = await db.select({ count: sql`COUNT(*)` }).from(tickets).where(
        and(whereClause, eq(tickets.status, 'open')),
      );
      const ticketsInProgress = await db.select({ count: sql`COUNT(*)` }).from(tickets).where(
        and(whereClause, eq(tickets.status, 'in_progress')),
      );
      const resolvedTickets = await db.select({ count: sql`COUNT(*)` }).from(tickets).where(
        and(whereClause, eq(tickets.status, 'resolved')),
      );
      const overdueMaintenance = await db.select({ count: sql`COUNT(*)` }).from(assets).where(
        and(whereClause, lt(assets.nextMaintenanceDate, today), eq(assets.status, 'active')),
      );
      const maintenanceDueThisWeek = await db.select({ count: sql`COUNT(*)` }).from(assets).where(
        and(whereClause, gte(assets.nextMaintenanceDate, today), lt(assets.nextMaintenanceDate, nextWeek), eq(assets.status, 'active')),
      );
      const warrantyExpired = await db.select({ count: sql`COUNT(*)` }).from(assets).where(
        and(whereClause, lt(assets.warrantyExpiry, today), eq(assets.status, 'active')),
      );
      const totalUsers = await db.select({ count: sql`COUNT(*)` }).from(users).where(whereClause);
      const criticalIssues = await db.select({ count: sql`COUNT(*)` }).from(tickets).where(
        and(whereClause, eq(tickets.status, 'open'), eq(tickets.priority, 'urgent')),
      );

      return {
        totalAssets: totalAssets[0].count,
        activeAssets: activeAssets[0].count,
        assetsUnderMaintenance: assetsUnderMaintenance[0].count,
        totalTickets: totalTickets[0].count,
        openTickets: openTickets[0].count,
        ticketsInProgress: ticketsInProgress[0].count,
        resolvedTickets: resolvedTickets[0].count,
        overdueMaintenance: overdueMaintenance[0].count,
        maintenanceDueThisWeek: maintenanceDueThisWeek[0].count,
        warrantyExpired: warrantyExpired[0].count,
        totalUsers: totalUsers[0].count,
        criticalIssues: criticalIssues[0].count,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      console.error('Error fetching dashboard stats:', error);
      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }

  // ─── Dashboard Assets ─────────────────────────────────────────────────────────────

  async getDashboardAssets(
    companyId: string,
    userId: string,
    cursor?: Date,
    limit = 20,
    search?: string,
    status?: string,
  ) {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user.length === 0 || user[0].companyId !== companyId) {
        throw new HTTPException(403, { message: 'Access denied to this company' });
      }

      const conditions: Array<ReturnType<typeof eq> | ReturnType<typeof gte> | ReturnType<typeof lt>> = [
        eq(assets.companyId, companyId),
        eq(assets.tenantId, user[0].tenantId || ''),
      ];
      if (status) conditions.push(eq(assets.status, status));
      if (cursor) conditions.push(gte(assets.createdAt, cursor));
      const whereClause = buildWhere(conditions);

      const totalCount = await db.select({ count: sql`COUNT(*)` }).from(assets).where(whereClause);
      const assetList = await db.select().from(assets).where(whereClause).limit(limit).orderBy(desc(assets.createdAt));

      const hasMore = assetList.length === limit;
      const last = assetList[assetList.length - 1];
      const nextCursor = hasMore && last
        ? new Date(last.createdAt.getTime() + limit * 60 * 1000).toISOString()
        : null;

      return {
        data: assetList,
        pagination: { cursor: nextCursor, hasMore, limit, total: Number(totalCount[0].count) },
      };
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      console.error('Error fetching dashboard assets:', error);
      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }

  // ─── Dashboard Tickets ───────────────────────────────────────────────────────────

  async getDashboardTickets(
    companyId: string,
    userId: string,
    cursor?: Date,
    limit = 20,
    status?: string,
    priority?: string,
  ) {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user.length === 0 || user[0].companyId !== companyId) {
        throw new HTTPException(403, { message: 'Access denied to this company' });
      }

      const conditions: Array<ReturnType<typeof eq> | ReturnType<typeof gte> | ReturnType<typeof lt>> = [
        eq(tickets.companyId, companyId),
        eq(tickets.tenantId, user[0].tenantId || ''),
      ];
      if (status) conditions.push(eq(tickets.status, status));
      if (priority) conditions.push(eq(tickets.priority, priority));
      if (cursor) conditions.push(gte(tickets.createdAt, cursor));
      const whereClause = buildWhere(conditions);

      const totalCount = await db.select({ count: sql`COUNT(*)` }).from(tickets).where(whereClause);
      const ticketList = await db.select().from(tickets).where(whereClause).limit(limit).orderBy(desc(tickets.createdAt));

      const hasMore = ticketList.length === limit;
      const last = ticketList[ticketList.length - 1];
      const nextCursor = hasMore && last
        ? new Date(last.createdAt.getTime() + limit * 60 * 1000).toISOString()
        : null;

      return {
        data: ticketList,
        pagination: { cursor: nextCursor, hasMore, limit, total: Number(totalCount[0].count) },
      };
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      console.error('Error fetching dashboard tickets:', error);
      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }

  // ─── Dashboard Users ──────────────────────────────────────────────────────────────

  async getDashboardUsers(
    companyId: string,
    userId: string,
    cursor?: Date,
    limit = 20,
  ) {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user.length === 0 || user[0].companyId !== companyId) {
        throw new HTTPException(403, { message: 'Access denied to this company' });
      }

      const conditions: Array<ReturnType<typeof eq> | ReturnType<typeof gte> | ReturnType<typeof lt>> = [
        eq(users.companyId, companyId),
        eq(users.tenantId, user[0].tenantId || ''),
      ];
      if (cursor) conditions.push(gte(users.createdAt, cursor));
      const whereClause = buildWhere(conditions);

      const totalCount = await db.select({ count: sql`COUNT(*)` }).from(users).where(whereClause);
      const userList = await db.select().from(users).where(whereClause).limit(limit).orderBy(desc(users.createdAt));

      const hasMore = userList.length === limit;
      const last = userList[userList.length - 1];
      const nextCursor = hasMore && last
        ? new Date(last.createdAt.getTime() + limit * 60 * 1000).toISOString()
        : null;

      return {
        data: userList,
        pagination: { cursor: nextCursor, hasMore, limit, total: Number(totalCount[0].count) },
      };
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      console.error('Error fetching dashboard users:', error);
      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }

  // ─── Dashboard Maintenance ───────────────────────────────────────────────────────

  async getDashboardMaintenance(
    companyId: string,
    userId: string,
    cursor?: Date,
    limit = 20,
    status?: string,
  ) {
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user.length === 0 || user[0].companyId !== companyId) {
        throw new HTTPException(403, { message: 'Access denied to this company' });
      }

      const conditions: Array<ReturnType<typeof eq> | ReturnType<typeof gte> | ReturnType<typeof lt>> = [
        eq(maintenanceRecords.companyId, companyId),
        eq(maintenanceRecords.tenantId, user[0].tenantId || ''),
      ];
      if (status) conditions.push(eq(maintenanceRecords.status, status));
      if (cursor) conditions.push(gte(maintenanceRecords.createdAt, cursor));
      const whereClause = buildWhere(conditions);

      const totalCount = await db.select({ count: sql`COUNT(*)` }).from(maintenanceRecords).where(whereClause);
      const maintenanceList = await db.select().from(maintenanceRecords).where(whereClause).limit(limit).orderBy(desc(maintenanceRecords.createdAt));

      const hasMore = maintenanceList.length === limit;
      const last = maintenanceList[maintenanceList.length - 1];
      const nextCursor = hasMore && last
        ? new Date(last.createdAt.getTime() + limit * 60 * 1000).toISOString()
        : null;

      return {
        data: maintenanceList,
        pagination: { cursor: nextCursor, hasMore, limit, total: Number(totalCount[0].count) },
      };
    } catch (error) {
      if (error instanceof HTTPException) throw error;
      console.error('Error fetching dashboard maintenance:', error);
      throw new HTTPException(500, { message: 'Internal server error' });
    }
  }
}
</content>
</invoke>