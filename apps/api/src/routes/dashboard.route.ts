import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { HTTPException } from './lib/errors';
import { DashboardService } from '../repositories/dashboard.repository';

const dashboardRoutes = new Hono<{ Variables: { user: any } }>();

// ─── Validation Schemas ─────────────────────────────────────────────────────────────

const getDashboardStatsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

const getAssetsSchema = z.object({
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'maintenance', 'retired', 'lost', 'stolen']).optional(),
});

const getTicketsSchema = z.object({
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical', 'urgent']).optional(),
});

const getUsersSchema = z.object({
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  role: z.enum(['user', 'admin', 'manager', 'supervisor']).optional(),
});

const getMaintenanceSchema = z.object({
  cursor: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']).optional(),
});

// ─── Helper Functions ───────────────────────────────────────────────────────────────

function parseCursor(cursor?: string): Date | undefined {
  if (!cursor) return undefined;
  const parsed = new Date(cursor);
  return isNaN(parsed.getTime()) ? undefined : parsed;
}

function createPaginationResponse<T>(data: T[], cursor?: Date, limit: number = 20) {
  const hasMore = data.length === limit;
  const nextCursor = hasMore && cursor ? new Date(cursor.getTime() + limit * 60 * 1000).toISOString() : null;
  
  return {
    data,
    pagination: {
      cursor: nextCursor,
      hasMore,
      limit,
    },
  };
}

// ─── Dashboard Routes ───────────────────────────────────────────────────────────────

// GET /api/dashboard/stats
dashboardRoutes.get('/stats', zValidator('query', getDashboardStatsSchema), async (c) => {
  try {
    const { startDate, endDate } = c.req.valid('query');
    const dashboardService = new DashboardService();
    
    const currentUser = c.get('user') as any;
    if (!currentUser?.id) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const stats = await dashboardService.getDashboardStats(
      currentUser.companyId,
      currentUser.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return c.json(stats, 200);
  } catch (error) {
    if (error instanceof HTTPException) {
      return error.getResponse();
    }
    console.error('Dashboard stats error:', error);
    return c.json(
      { statusCode: 500, message: 'Internal server error' },
      500
    );
  }
});

// GET /api/dashboard/assets
dashboardRoutes.get('/assets', zValidator('query', getAssetsSchema), async (c) => {
  try {
    const { cursor, limit = 20, search, status } = c.req.valid('query');
    const dashboardService = new DashboardService();
    
    const currentUser = c.get('user') as any;
    if (!currentUser?.id) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const parsedCursor = parseCursor(cursor);
    const result = await dashboardService.getDashboardAssets(
      currentUser.companyId,
      currentUser.id,
      parsedCursor,
      limit,
      search,
      status
    );

    return c.json(result, 200);
  } catch (error) {
    if (error instanceof HTTPException) {
      return error.getResponse();
    }
    console.error('Dashboard assets error:', error);
    return c.json(
      { statusCode: 500, message: 'Internal server error' },
      500
    );
  }
});

// GET /api/dashboard/tickets
dashboardRoutes.get('/tickets', zValidator('query', getTicketsSchema), async (c) => {
  try {
    const { cursor, limit = 20, status, priority } = c.req.valid('query');
    const dashboardService = new DashboardService();
    
    const currentUser = c.get('user') as any;
    if (!currentUser?.id) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const parsedCursor = parseCursor(cursor);
    const result = await dashboardService.getDashboardTickets(
      currentUser.companyId,
      currentUser.id,
      parsedCursor,
      limit,
      status,
      priority
    );

    return c.json(result, 200);
  } catch (error) {
    if (error instanceof HTTPException) {
      return error.getResponse();
    }
    console.error('Dashboard tickets error:', error);
    return c.json(
      { statusCode: 500, message: 'Internal server error' },
      500
    );
  }
});

// GET /api/dashboard/users
dashboardRoutes.get('/users', zValidator('query', getUsersSchema), async (c) => {
  try {
    const { cursor, limit = 20, role } = c.req.valid('query');
    const dashboardService = new DashboardService();
    
    const currentUser = c.get('user') as any;
    if (!currentUser?.id) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const parsedCursor = parseCursor(cursor);
    const result = await dashboardService.getDashboardUsers(
      currentUser.companyId,
      currentUser.id,
      parsedCursor,
      limit,
      role
    );

    return c.json(result, 200);
  } catch (error) {
    if (error instanceof HTTPException) {
      return error.getResponse();
    }
    console.error('Dashboard users error:', error);
    return c.json(
      { statusCode: 500, message: 'Internal server error' },
      500
    );
  }
});

// GET /api/dashboard/maintenance
dashboardRoutes.get('/maintenance', zValidator('query', getMaintenanceSchema), async (c) => {
  try {
    const { cursor, limit = 20, status } = c.req.valid('query');
    const dashboardService = new DashboardService();
    
    const currentUser = c.get('user') as any;
    if (!currentUser?.id) {
      throw new HTTPException(401, { message: 'Authentication required' });
    }

    const parsedCursor = parseCursor(cursor);
    const result = await dashboardService.getDashboardMaintenance(
      currentUser.companyId,
      currentUser.id,
      parsedCursor,
      limit,
      status
    );

    return c.json(result, 200);
  } catch (error) {
    if (error instanceof HTTPException) {
      return error.getResponse();
    }
    console.error('Dashboard maintenance error:', error);
    return c.json(
      { statusCode: 500, message: 'Internal server error' },
      500
    );
  }
});

export { dashboardRoutes };