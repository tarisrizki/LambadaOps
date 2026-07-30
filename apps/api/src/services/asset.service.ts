import { assetRepository } from '../repositories/asset.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { planLimitService } from './plan-limit.service.js';
import { ConflictError, ValidationError, NotFoundError } from '../lib/errors.js';
import { activityService } from './activity.service.js';
import { notificationService } from './notification.service.js';
import { SystemRoles } from '../lib/auth/roles.js';
import { TenantContext } from '../lib/tenant-context.js';
import crypto from 'node:crypto';
// eslint-disable-next-line no-restricted-imports
import type { assets } from '../db/schema/asset.schema.js';

export type CreateAssetInput = Omit<typeof assets.$inferInsert, 'tenantId' | 'id' | 'createdAt' | 'updatedAt' | 'version' | 'deletedAt' | 'assetCode' | 'qrCodeToken'>;
export type UpdateAssetInput = Partial<Omit<typeof assets.$inferInsert, 'tenantId' | 'id' | 'createdAt' | 'updatedAt' | 'version' | 'deletedAt'>>;

export class AssetService {
  /**
   * Retrieves an asset by ID within the current tenant context.
   */
  async getAssetById(id: number) {
    const asset = await assetRepository.findById(id);
    if (!asset) {
      throw new NotFoundError('Asset');
    }
    return asset;
  }

  /**
   * Retrieves an asset by QR Code Token within the current tenant context.
   */
  async getAssetByQrCode(qrCodeToken: string) {
    const asset = await assetRepository.findByQrCode(qrCodeToken);
    if (!asset) {
      throw new NotFoundError('Asset with QR Code');
    }
    return asset;
  }

  /**
   * Lists all assets for the current tenant.
   */
  async listAssets(search?: string) {
    return assetRepository.findAll(search);
  }

  /**
   * Creates a new asset, enforcing plan limits and logging the creation event.
   */
  async createAsset(data: CreateAssetInput, actorUserId: number, actorNameSnapshot: string) {
    await planLimitService.checkAssetLimit();

    try {
      return await assetRepository.transaction(async (txRepo) => {
        const count = await txRepo.countTotal();
        const assetCode = `AST-${String(count + 1).padStart(6, '0')}`;
        const qrCodeToken = crypto.randomUUID();

        // Sanitize empty strings for dates and numbers
        const sanitizedData = { ...data };
        if (sanitizedData.purchaseDate === '') sanitizedData.purchaseDate = undefined;
        if (sanitizedData.warrantyEnd === '') sanitizedData.warrantyEnd = undefined;
        if (sanitizedData.purchasePrice === '') sanitizedData.purchasePrice = undefined;

        // Create the asset
        const asset = await txRepo.create({
          ...sanitizedData,
          assetCode,
          qrCodeToken,
        });

        // Record the event
        const correlationId = crypto.randomUUID();
        
        await activityService.logEvent({
          assetId: asset.id,
          eventType: 'CREATED',
          category: 'LIFECYCLE',
          severity: 'INFO',
          oldValue: null,
          newValue: asset,
          actorUserId,
          actorNameSnapshot,
          note: 'Asset registered in system',
          correlationId,
        }, txRepo.txSession);

        // Record the audit log
        await activityService.logAudit({
          entityType: 'asset',
          entityId: asset.id.toString(),
          action: 'CREATE',
          oldValue: null,
          newValue: asset,
          actorId: actorUserId,
          correlationId,
        }, txRepo.txSession);

        return asset;
      });
    } catch (err: unknown) {
      const error = err as Record<string, unknown>;
      if (error?.code === '23505') {
        throw new ConflictError('Asset code is already in use');
      }
      if (error?.code === '23503') {
        throw new ValidationError('Invalid reference: Category, Location, or Department does not exist');
      }
      throw error;
    }
  }

  /**
   * Updates an asset using optimistic locking and logs the update event.
   */
  async updateAsset(
    id: number,
    currentVersion: number,
    data: UpdateAssetInput,
    actorUserId: number,
    actorNameSnapshot: string
  ) {
    const assetBefore = await this.getAssetById(id); // Ensures it exists and is not deleted

    try {
      return await assetRepository.transaction(async (txRepo) => {
        // Sanitize empty strings for dates and numbers
        const sanitizedData = { ...data };
        if (sanitizedData.purchaseDate === '') sanitizedData.purchaseDate = undefined;
        if (sanitizedData.warrantyEnd === '') sanitizedData.warrantyEnd = undefined;
        if (sanitizedData.purchasePrice === '') sanitizedData.purchasePrice = undefined;

        // Attempt optimistic update
        const updatedAsset = await txRepo.updateWithVersion(id, currentVersion, sanitizedData);
        
        if (!updatedAsset) {
          throw new ConflictError('Concurrency conflict: The asset was modified by someone else. Please refresh and try again.');
        }

        // Record the event
        const correlationId = crypto.randomUUID();
        const eventType = assetBefore.status !== updatedAsset.status ? 'STATUS_CHANGED' : 'UPDATED';

        await activityService.logEvent({
          assetId: id,
          eventType,
          category: 'LIFECYCLE',
          severity: 'INFO',
          oldValue: assetBefore,
          newValue: updatedAsset,
          actorUserId,
          actorNameSnapshot,
          note: 'Asset details updated',
          correlationId,
        }, txRepo.txSession);

        await activityService.logAudit({
          entityType: 'asset',
          entityId: id.toString(),
          action: 'UPDATE',
          oldValue: assetBefore,
          newValue: updatedAsset,
          actorId: actorUserId,
          correlationId,
        }, txRepo.txSession);

        return updatedAsset;
      });
    } catch (err: unknown) {
      const error = err as Record<string, unknown>;
      if (error?.code === '23505') {
        throw new ConflictError('Asset code is already in use');
      }
      if (error?.code === '23503') {
        throw new ValidationError('Invalid reference: Category, Location, or Department does not exist');
      }
      throw error;
    }
  }

  /**
   * Soft deletes an asset using optimistic locking and logs the deletion event.
   */
  async softDeleteAsset(id: number, currentVersion: number, actorUserId: number, actorNameSnapshot: string) {
    const assetBefore = await this.getAssetById(id); // Ensure it exists and is not deleted

    return await assetRepository.transaction(async (txRepo) => {
      const deletedAsset = await txRepo.softDelete(id, currentVersion);
      
      if (!deletedAsset) {
        throw new ConflictError('Concurrency conflict: The asset was modified by someone else. Please refresh and try again.');
      }

      const correlationId = crypto.randomUUID();
      
      await activityService.logEvent({
        assetId: id,
        eventType: 'DELETED',
        category: 'LIFECYCLE',
        severity: 'NOTICE',
        oldValue: assetBefore,
        newValue: deletedAsset,
        actorUserId,
        actorNameSnapshot,
        note: 'Asset retired / deleted',
        correlationId,
      }, txRepo.txSession);

      await activityService.logAudit({
        entityType: 'asset',
        entityId: id.toString(),
        action: 'DELETE',
        oldValue: assetBefore,
        newValue: deletedAsset,
        actorId: actorUserId,
        correlationId,
      }, txRepo.txSession);

      return deletedAsset;
    });
  }

  /**
   * Triggers notifications for assets with warranties expiring within 30 days.
   * Typically called by a daily cron job.
   */
  async triggerWarrantyNotifications(tenantId: number) {
    return TenantContext.run({ tenantId }, async () => {
      const today = new Date();
      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);

      const expiringAssets = await assetRepository.findExpiringWarranties(today, in30Days);

      let notifiedCount = 0;
      if (expiringAssets.length === 0) return { notifiedCount };

      const itManagers = await userRepository.findByRole(SystemRoles.IT_MANAGER);

      for (const asset of expiringAssets) {
        for (const manager of itManagers) {
          await notificationService.createNotification({
            tenantId,
            userId: manager.id,
            type: 'warranty_expiring',
            title: 'Asset Warranty Expiring',
            message: `Warranty for asset "${asset.name}" (${asset.assetCode}) will expire on ${asset.warrantyEnd}.`,
            actionUrl: `/assets/${asset.id}`
          });
          notifiedCount++;
        }
      }

      return { notifiedCount };
    });
  }
}

export const assetService = new AssetService();
