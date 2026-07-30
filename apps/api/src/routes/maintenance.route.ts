import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { maintenanceService } from '../services/maintenance.service.js';
import { maintenanceRepository } from '../repositories/maintenance.repository.js';
import {
  scheduleMaintenanceSchema,
  maintenanceActionSchema,
  completeMaintenanceSchema,
  addPartSchema,
  addNoteSchema,
} from '../schemas/maintenance.schema.js';
import type { AccessTokenClaims } from '../lib/auth/jwt.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireAnyRole } from '../middleware/rbac.middleware.js';
import { SystemRoles } from '../lib/auth/roles.js';

type Variables = {
  user: AccessTokenClaims;
};

export const maintenanceRouter = new Hono<{ Variables: Variables }>()
  .use('*', authMiddleware)

/**
 * [GET] /maintenance
 * Lists maintenance jobs (basic search).
 * SPEC §6: IT Manager, Owner/Admin can manage schedules. Technicians can update assigned.
 */
  .get('/', async (c) => {
  const assetIdStr = c.req.query('assetId');
  
  if (assetIdStr) {
    const assetId = parseInt(assetIdStr, 10);
    const jobs = await maintenanceRepository.findJobsByAsset(assetId);
    return c.json({ status: 'success', data: jobs });
  }

  return c.json({ status: 'success', data: [] });
})

/**
 * [GET] /maintenance/:id
 * Retrieves a maintenance job by ID with parts and notes.
 */
  .get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const job = await maintenanceRepository.findJobById(id);
  if (!job) {
    return c.json({ status: 'error', message: 'Maintenance Job not found' }, 404);
  }

  const parts = await maintenanceRepository.getPartsByJob(id);
  const notes = await maintenanceRepository.getNotesByJob(id);

  return c.json({
    status: 'success',
    data: {
      ...job,
      parts,
      notes,
    },
  });
})

/**
 * [POST] /maintenance
 * Schedules a new maintenance job.
 * SPEC §0: Owner/Admin and IT Manager only.
 */
  .post(
  '/',
  requireAnyRole([SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER]),
  zValidator('json', scheduleMaintenanceSchema),
  async (c) => {
    const data = c.req.valid('json');
    const user = c.get('user');
    const actorUserId = user.userId;
    const actorNameSnapshot = `User ${actorUserId}`;

    const newJob = await maintenanceService.scheduleMaintenance({
      ...data,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
      actorUserId,
      actorNameSnapshot,
    });
    
    return c.json({
      status: 'success',
      data: newJob,
    }, 201);
  }
)

/**
 * [POST] /maintenance/:id/start
 * Starts a maintenance job.
 * SPEC §0: Owner/Admin, IT Manager, and Technician (assigned task).
 */
  .post(
  '/:id/start',
  requireAnyRole([SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER, SystemRoles.TECHNICIAN]),
  zValidator('json', maintenanceActionSchema),
  async (c) => {
    const jobId = parseInt(c.req.param('id'), 10);
    const data = c.req.valid('json');
    const user = c.get('user');
    const actorUserId = user.userId;
    const actorNameSnapshot = `User ${actorUserId}`;

    const result = await maintenanceService.startMaintenance({
      jobId,
      version: data.version,
      note: data.note,
      actorUserId,
      actorNameSnapshot,
    });
    
    return c.json({ status: 'success', data: result });
  }
)

/**
 * [POST] /maintenance/:id/pause
 * Pauses a maintenance job.
 * SPEC §0: Owner/Admin, IT Manager, and Technician (assigned task).
 */
  .post(
  '/:id/pause',
  requireAnyRole([SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER, SystemRoles.TECHNICIAN]),
  zValidator('json', maintenanceActionSchema),
  async (c) => {
    const jobId = parseInt(c.req.param('id'), 10);
    const data = c.req.valid('json');
    const user = c.get('user');
    const actorUserId = user.userId;
    const actorNameSnapshot = `User ${actorUserId}`;

    const result = await maintenanceService.pauseMaintenance({
      jobId,
      version: data.version,
      note: data.note,
      actorUserId,
      actorNameSnapshot,
    });
    
    return c.json({ status: 'success', data: result });
  }
)

/**
 * [POST] /maintenance/:id/resume
 * Resumes a maintenance job.
 * SPEC §0: Owner/Admin, IT Manager, and Technician (assigned task).
 */
  .post(
  '/:id/resume',
  requireAnyRole([SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER, SystemRoles.TECHNICIAN]),
  zValidator('json', maintenanceActionSchema),
  async (c) => {
    const jobId = parseInt(c.req.param('id'), 10);
    const data = c.req.valid('json');
    const user = c.get('user');
    const actorUserId = user.userId;
    const actorNameSnapshot = `User ${actorUserId}`;

    const result = await maintenanceService.resumeMaintenance({
      jobId,
      version: data.version,
      note: data.note,
      actorUserId,
      actorNameSnapshot,
    });
    
    return c.json({ status: 'success', data: result });
  }
)

/**
 * [POST] /maintenance/:id/complete
 * Completes a maintenance job.
 * SPEC §0: Owner/Admin, IT Manager, and Technician (assigned task).
 */
  .post(
  '/:id/complete',
  requireAnyRole([SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER, SystemRoles.TECHNICIAN]),
  zValidator('json', completeMaintenanceSchema),
  async (c) => {
    const jobId = parseInt(c.req.param('id'), 10);
    const data = c.req.valid('json');
    const user = c.get('user');
    const actorUserId = user.userId;
    const actorNameSnapshot = `User ${actorUserId}`;

    const result = await maintenanceService.completeMaintenance({
      jobId,
      ...data,
      actorUserId,
      actorNameSnapshot,
    });
    
    return c.json({ status: 'success', data: result });
  }
)

/**
 * [POST] /maintenance/:id/cancel
 * Cancels a maintenance job.
 * SPEC §0: Owner/Admin and IT Manager only.
 */
  .post(
  '/:id/cancel',
  requireAnyRole([SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER]),
  zValidator('json', maintenanceActionSchema),
  async (c) => {
    const jobId = parseInt(c.req.param('id'), 10);
    const data = c.req.valid('json');
    const user = c.get('user');
    const actorUserId = user.userId;
    const actorNameSnapshot = `User ${actorUserId}`;

    const result = await maintenanceService.cancelMaintenance({
      jobId,
      version: data.version,
      note: data.note,
      actorUserId,
      actorNameSnapshot,
    });
    
    return c.json({ status: 'success', data: result });
  }
)

/**
 * [POST] /maintenance/:id/parts
 * Adds a part to a maintenance job.
 * SPEC §0: Owner/Admin, IT Manager, and Technician.
 */
  .post(
  '/:id/parts',
  requireAnyRole([SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER, SystemRoles.TECHNICIAN]),
  zValidator('json', addPartSchema),
  async (c) => {
    const jobId = parseInt(c.req.param('id'), 10);
    const data = c.req.valid('json');
    const user = c.get('user');
    const actorUserId = user.userId;
    const actorNameSnapshot = `User ${actorUserId}`;

    const result = await maintenanceService.addPart({
      jobId,
      ...data,
      actorUserId,
      actorNameSnapshot,
    });
    
    return c.json({ status: 'success', data: result });
  }
)

/**
 * [POST] /maintenance/:id/notes
 * Adds a note to a maintenance job.
 * SPEC §0: Owner/Admin, IT Manager, and Technician.
 */
  .post(
  '/:id/notes',
  requireAnyRole([SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER, SystemRoles.TECHNICIAN]),
  zValidator('json', addNoteSchema),
  async (c) => {
    const jobId = parseInt(c.req.param('id'), 10);
    const data = c.req.valid('json');
    const user = c.get('user');
    const actorUserId = user.userId;
    const actorNameSnapshot = `User ${actorUserId}`;

    const result = await maintenanceService.addNote(jobId, data.note, actorUserId, actorNameSnapshot);
    
    return c.json({ status: 'success', data: result });
  });
