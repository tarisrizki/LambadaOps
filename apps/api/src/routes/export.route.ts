import { Hono } from 'hono';
import { exportService } from '../services/export.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireAnyRole } from '../middleware/rbac.middleware.js';
import { SystemRoles } from '../lib/auth/roles.js';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import * as fs from 'node:fs/promises';
import type { AccessTokenClaims } from '../lib/auth/jwt.js';

export const exportRouter = new Hono<{ Variables: { user: AccessTokenClaims } }>()
  .use('*', authMiddleware)
  /**
   * [POST] /export
   * Trigger a new export job. SPEC §11: Owner/Admin and IT Manager only.
   */
  .post(
    '/',
  requireAnyRole([SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER]),
  zValidator('json', z.object({
    entityType: z.enum(['assets', 'tickets']),
  })),
  async (c) => {
    const { entityType } = c.req.valid('json');
    const user = c.get('user');

    const job = await exportService.startExportJob(user.tenantId, user.userId, entityType);
    return c.json({ status: 'success', data: job }, 202);
  }
)
  /**
   * [GET] /export/recent
   * Get recent export jobs for the current tenant.
   */
  .get(
    '/recent',
  requireAnyRole([SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER]),
  async (c) => {
    const jobs = await exportService.getRecentExportJobs();
    return c.json({ status: 'success', data: jobs });
  }
)
  /**
   * [GET] /export/:id
   * Get export job status.
   */
  .get(
    '/:id',
  requireAnyRole([SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER]),
  async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    const job = await exportService.getExportJob(id);
    return c.json({ status: 'success', data: job });
  }
)
  /**
   * [GET] /export/:id/download
   * Download the generated CSV file.
   * fileUrl in DB stores the absolute tmp file path (MVP local mock; production uses S3 presigned URL).
   */
  .get(
    '/:id/download',
  requireAnyRole([SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER]),
  async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    const job = await exportService.getExportJob(id);

    if (job.status !== 'completed') {
      return c.json({ error: 'Export is not completed yet' }, 400);
    }

    if (!job.fileUrl) {
      return c.json({ error: 'File not available' }, 404);
    }

    try {
      const fileContent = await fs.readFile(job.fileUrl, 'utf-8');
      const fileName = `export_${job.entityType}_${job.id}.csv`;

      return new Response(fileContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${fileName}"`
        }
      });
    } catch {
      return c.json({ error: 'File not found on server (it may have expired)' }, 404);
    }
  }
);
