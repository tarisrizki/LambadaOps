import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { assetService } from '../services/asset.service.js';
import { createAssetSchema, updateAssetSchema, softDeleteAssetSchema } from '../schemas/asset.schema.js';
import { assignmentRouter } from './assignment.route.js';
import { attachmentRouter } from './attachment.route.js';
import type { AccessTokenClaims } from '../lib/auth/jwt.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireAnyRole } from '../middleware/rbac.middleware.js';
import { SystemRoles } from '../lib/auth/roles.js';

type Variables = {
  user: AccessTokenClaims;
};

export const assetRouter = new Hono<{ Variables: Variables }>()
  // All asset routes require authentication and a resolved tenant context
  .use('*', authMiddleware)
  // Mount assignment sub-routes
  .route('/:assetId/assignments', assignmentRouter)
  // Mount attachment sub-routes
  .route('/', attachmentRouter)
  /**
   * [GET] /assets
   * Lists all assets for the current tenant.
   * SPEC §0: IT Manager and Owner/Admin see all assets.
   */
  .get('/', async (c) => {
  const search = c.req.query('search');
  const assets = await assetService.listAssets(search);
  
  return c.json({
    status: 'success',
    data: assets,
  });
  })
  /**
   * [GET] /assets/scan/:qrCodeToken
   * Retrieves an asset by its unique QR code token. SPEC §4.
   */
  .get('/scan/:qrCodeToken', async (c) => {
  const qrCodeToken = c.req.param('qrCodeToken');
  const asset = await assetService.getAssetByQrCode(qrCodeToken);
  
  return c.json({
    status: 'success',
    data: asset,
  });
  })
  /**
   * [GET] /assets/:id
   * Retrieves a specific asset by ID.
   */
  .get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const asset = await assetService.getAssetById(id);
  
  return c.json({
    status: 'success',
    data: asset,
  });
  })
  /**
   * [POST] /assets
   * Creates a new asset. SPEC §0: Owner/Admin and IT Manager only.
   */
  .post(
  '/',
  requireAnyRole([SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER]),
  zValidator('json', createAssetSchema),
  async (c) => {
    const data = c.req.valid('json');
    const user = c.get('user');
    const actorUserId = user.userId;
    const actorNameSnapshot = `User ${actorUserId}`;
    
    const newAsset = await assetService.createAsset(data, actorUserId, actorNameSnapshot);
    
    return c.json({
      status: 'success',
      data: newAsset,
    }, 201);
  }
  )
  /**
   * [PUT] /assets/:id
   * Updates an asset with optimistic locking. SPEC §0: Owner/Admin and IT Manager only.
   */
  .put(
  '/:id',
  requireAnyRole([SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER]),
  zValidator('json', updateAssetSchema),
  async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    const { version, ...updateData } = c.req.valid('json');
    const user = c.get('user');
    const actorUserId = user.userId;
    const actorNameSnapshot = `User ${actorUserId}`;

    const updatedAsset = await assetService.updateAsset(
      id,
      version,
      updateData,
      actorUserId,
      actorNameSnapshot
    );
    
    return c.json({
      status: 'success',
      data: updatedAsset,
    });
  }
  )
  /**
   * [DELETE] /assets/:id
   * Soft deletes an asset with optimistic locking. SPEC §0: Owner/Admin and IT Manager only.
   */
  .delete(
  '/:id',
  requireAnyRole([SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER]),
  zValidator('json', softDeleteAssetSchema),
  async (c) => {
    const id = parseInt(c.req.param('id'), 10);
    const { version } = c.req.valid('json');
    const user = c.get('user');
    const actorUserId = user.userId;
    const actorNameSnapshot = `User ${actorUserId}`;

    const deletedAsset = await assetService.softDeleteAsset(
      id,
      version,
      actorUserId,
      actorNameSnapshot
    );

    return c.json({
      status: 'success',
      data: deletedAsset,
    });
  }
);
