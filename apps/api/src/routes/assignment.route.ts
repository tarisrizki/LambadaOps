import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { assignmentService } from '../services/assignment.service.js';
import { assignAssetSchema, transferAssetSchema, returnAssetSchema } from '../schemas/assignment.schema.js';
import type { AccessTokenClaims } from '../lib/auth/jwt.js';
import { requireAnyRole } from '../middleware/rbac.middleware.js';
import { SystemRoles } from '../lib/auth/roles.js';

type Variables = {
  user: AccessTokenClaims;
};

// This router will be mounted at /api/assets/:assetId/assignments
export const assignmentRouter = new Hono<{ Variables: Variables }>();

/**
 * [GET] /api/assets/:assetId/assignments
 * Retrieves the assignment history for an asset.
 * SPEC §5: IT Manager and Owner/Admin can view assignment history.
 */
assignmentRouter.get(
  '/',
  requireAnyRole([SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER]),
  async (c) => {
    const assetId = parseInt(c.req.param('assetId')!, 10);
    const history = await assignmentService.getAssignmentHistory(assetId);
    
    return c.json({
      status: 'success',
      data: history,
    });
  }
);

/**
 * [POST] /api/assets/:assetId/assignments
 * Assigns an asset to a user or department.
 * SPEC §0: Owner/Admin and IT Manager only.
 */
assignmentRouter.post(
  '/',
  requireAnyRole([SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER]),
  zValidator('json', assignAssetSchema),
  async (c) => {
    const assetId = parseInt(c.req.param('assetId')!, 10);
    const data = c.req.valid('json');
    const user = c.get('user');
    const actorUserId = user.userId;
    const actorNameSnapshot = `User ${actorUserId}`;

    const result = await assignmentService.assignAsset({
      assetId,
      version: data.version,
      assignmentType: data.assignmentType,
      userId: data.userId,
      departmentId: data.departmentId,
      note: data.note,
      actorUserId,
      actorNameSnapshot,
    });
    
    return c.json({
      status: 'success',
      data: result,
    });
  }
);

/**
 * [POST] /api/assets/:assetId/assignments/transfer
 * Transfers an asset to a new user or department.
 * SPEC §0: Owner/Admin and IT Manager only.
 */
assignmentRouter.post(
  '/transfer',
  requireAnyRole([SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER]),
  zValidator('json', transferAssetSchema),
  async (c) => {
    const assetId = parseInt(c.req.param('assetId')!, 10);
    const data = c.req.valid('json');
    const user = c.get('user');
    const actorUserId = user.userId;
    const actorNameSnapshot = `User ${actorUserId}`;

    const result = await assignmentService.transferAsset({
      assetId,
      version: data.version,
      assignmentType: data.assignmentType,
      userId: data.userId,
      departmentId: data.departmentId,
      note: data.note,
      actorUserId,
      actorNameSnapshot,
    });
    
    return c.json({
      status: 'success',
      data: result,
    });
  }
);

/**
 * [POST] /api/assets/:assetId/assignments/return
 * Returns an asset.
 * SPEC §0: Owner/Admin and IT Manager only.
 */
assignmentRouter.post(
  '/return',
  requireAnyRole([SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER]),
  zValidator('json', returnAssetSchema),
  async (c) => {
    const assetId = parseInt(c.req.param('assetId')!, 10);
    const data = c.req.valid('json');
    const user = c.get('user');
    const actorUserId = user.userId;
    const actorNameSnapshot = `User ${actorUserId}`;

    const result = await assignmentService.returnAsset({
      assetId,
      version: data.version,
      note: data.note,
      actorUserId,
      actorNameSnapshot,
    });
    
    return c.json({
      status: 'success',
      data: result,
    });
  }
);
