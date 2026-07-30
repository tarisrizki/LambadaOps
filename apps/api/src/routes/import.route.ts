import { Hono } from 'hono';
import { importService } from '../services/import.service.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireAnyRole } from '../middleware/rbac.middleware.js';
import { SystemRoles } from '../lib/auth/roles.js';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import crypto from 'node:crypto';

import type { AccessTokenClaims } from '../lib/auth/jwt.js';

export const importRouter = new Hono<{
  Variables: {
    user: AccessTokenClaims;
  };
}>();

// Ensure only OWNER_ADMIN or IT_MANAGER can import
importRouter.use('*', authMiddleware);
importRouter.use('*', requireAnyRole([SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER]));

/**
 * [POST] /import/assets
 * Upload assets.xlsx and queue import job
 */
importRouter.post('/assets', async (c) => {
  const user = c.get('user');

  try {
    const body = await c.req.parseBody();
    const file = body['file'] as File;

    if (!file || !file.name) {
      return c.json({ status: 'error', message: 'File is required' }, 400);
    }

    if (!file.name.endsWith('.xlsx')) {
      return c.json({ status: 'error', message: 'Only .xlsx files are supported' }, 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const filename = `${user.tenantId}-${crypto.randomUUID()}-${file.name}`;
    const filePath = join(tmpdir(), filename);

    await writeFile(filePath, buffer);

    const job = await importService.startImportJob(user.tenantId, user.userId, filePath);

    return c.json({ status: 'success', data: job }, 202);
  } catch (err) {
    console.error('Import upload error:', err);
    throw err;
  }
});

/**
 * [GET] /import/jobs/:id
 * Get import job status
 */
importRouter.get('/jobs/:id', async (c) => {
  const jobId = parseInt(c.req.param('id'), 10);
  const user = c.get('user');

  const job = await importService.getImportJob(jobId);
  
  if (job.tenantId !== user.tenantId) {
    return c.json({ status: 'error', message: 'Import Job not found' }, 404);
  }

  return c.json({ status: 'success', data: job });
});

/**
 * [GET] /import/jobs/:id/errors
 * Get import job errors
 */
importRouter.get('/jobs/:id/errors', async (c) => {
  const jobId = parseInt(c.req.param('id'), 10);
  const user = c.get('user');

  const job = await importService.getImportJob(jobId);
  
  if (job.tenantId !== user.tenantId) {
    return c.json({ status: 'error', message: 'Import Job not found' }, 404);
  }

  const errors = await importService.getImportErrors(jobId);

  return c.json({ status: 'success', data: errors });
});
