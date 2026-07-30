import { assetRepository } from '../repositories/asset.repository.js';
import { BusinessRuleError, ConflictError, ValidationError, NotFoundError } from '../lib/errors.js';
import { activityService } from './activity.service.js';
import crypto from 'node:crypto';

export interface AssignAssetParams {
  assetId: number;
  version: number;
  assignmentType: 'individual' | 'shared' | 'unassigned';
  userId?: number | null;
  departmentId?: number | null;
  note?: string;
  actorUserId: number;
  actorNameSnapshot: string;
}

export interface ReturnAssetParams {
  assetId: number;
  version: number;
  note?: string;
  actorUserId: number;
  actorNameSnapshot: string;
}

export class AssignmentService {
  /**
   * Internal helper to validate asset eligibility for assignment and transfer.
   */
  private async validateAssetForAssignment(assetId: number) {
    const asset = await assetRepository.findById(assetId);
    if (!asset) {
      throw new NotFoundError('Asset');
    }
    if (asset.deletedAt || asset.status === 'retired' || asset.status === 'disposed') {
      throw new BusinessRuleError('Cannot assign a deleted, retired, or disposed asset.');
    }
    return asset;
  }

  /**
   * Internal helper to validate asset eligibility for return.
   */
  private async validateAssetForReturn(assetId: number) {
    const asset = await assetRepository.findById(assetId);
    if (!asset) {
      throw new NotFoundError('Asset');
    }
    if (asset.deletedAt) {
      throw new BusinessRuleError('Cannot return a deleted asset.');
    }
    return asset;
  }

  private validateAssignmentTarget(params: AssignAssetParams) {
    if (params.assignmentType === 'individual' && !params.userId) {
      throw new BusinessRuleError('Individual assignment requires a userId');
    }
    if (params.assignmentType === 'shared' && !params.departmentId) {
      throw new BusinessRuleError('Shared assignment requires a departmentId');
    }
  }

  /**
   * Assigns an asset. Throws if an active assignment already exists.
   */
  async assignAsset(params: AssignAssetParams) {
    this.validateAssignmentTarget(params);
    const asset = await this.validateAssetForAssignment(params.assetId);

    try {
      return await assetRepository.transaction(async (txRepo) => {
        // Check if an active assignment already exists
        const activeAssignment = await txRepo.getActiveAssignment(params.assetId);
        if (activeAssignment) {
          throw new BusinessRuleError('Asset is already assigned. Please use transfer or return workflow first.');
        }

        // Insert new assignment
        const newAssignment = await txRepo.insertAssignment({
          assetId: params.assetId,
          assignmentType: params.assignmentType,
          userId: params.userId ?? null,
          departmentId: params.departmentId ?? null,
          createdBy: params.actorUserId,
        });

        // Update asset
        const updatedAsset = await txRepo.updateWithVersion(params.assetId, params.version, {
          currentAssignedUserId: params.userId ?? null,
          departmentId: params.departmentId ?? null,
          assignmentType: params.assignmentType,
        });

        if (!updatedAsset) {
          throw new ConflictError('Concurrency conflict: The asset was modified by someone else. Please refresh and try again.');
        }

        // Create Event
        const correlationId = crypto.randomUUID();
        
        await activityService.logEvent({
          assetId: params.assetId,
          eventType: 'ASSIGNED',
          category: 'ASSIGNMENT',
          severity: 'INFO',
          oldValue: asset,
          newValue: updatedAsset,
          actorUserId: params.actorUserId,
          actorNameSnapshot: params.actorNameSnapshot,
          note: params.note || 'Asset assigned',
          correlationId,
        }, txRepo.txSession);

        await activityService.logAudit({
          entityType: 'asset',
          entityId: params.assetId.toString(),
          action: 'ASSIGN_ASSET',
          oldValue: asset,
          newValue: updatedAsset,
          actorId: params.actorUserId,
          correlationId,
        }, txRepo.txSession);

        return { asset: updatedAsset, assignment: newAssignment };
      });
    } catch (err: unknown) {
      const error = err as Record<string, unknown>;
      if (error?.code === '23503') {
        throw new ValidationError('Invalid reference: User or Department does not exist');
      }
      throw error;
    }
  }

  /**
   * Transfers an asset to a new user/department. Closes the old assignment and opens a new one.
   */
  async transferAsset(params: AssignAssetParams) {
    this.validateAssignmentTarget(params);
    const asset = await this.validateAssetForAssignment(params.assetId);

    try {
      return await assetRepository.transaction(async (txRepo) => {
        // Close current assignment if exists
        const activeAssignment = await txRepo.getActiveAssignment(params.assetId);
        if (activeAssignment) {
          await txRepo.closeAssignment(activeAssignment.id);
        }

        // Open new assignment
        const newAssignment = await txRepo.insertAssignment({
          assetId: params.assetId,
          assignmentType: params.assignmentType,
          userId: params.userId ?? null,
          departmentId: params.departmentId ?? null,
          createdBy: params.actorUserId,
        });

        // Sync asset state
        const updatedAsset = await txRepo.updateWithVersion(params.assetId, params.version, {
          currentAssignedUserId: params.userId ?? null,
          departmentId: params.departmentId ?? null,
          assignmentType: params.assignmentType,
        });

        if (!updatedAsset) {
          throw new ConflictError('Concurrency conflict: The asset was modified by someone else. Please refresh and try again.');
        }

        // Create Event
        const correlationId = crypto.randomUUID();
        
        await activityService.logEvent({
          assetId: params.assetId,
          eventType: 'TRANSFERRED',
          category: 'ASSIGNMENT',
          severity: 'INFO',
          oldValue: asset,
          newValue: updatedAsset,
          actorUserId: params.actorUserId,
          actorNameSnapshot: params.actorNameSnapshot,
          note: params.note || 'Asset transferred',
          correlationId,
        }, txRepo.txSession);

        await activityService.logAudit({
          entityType: 'asset',
          entityId: params.assetId.toString(),
          action: 'TRANSFER_ASSET',
          oldValue: asset,
          newValue: updatedAsset,
          actorId: params.actorUserId,
          correlationId,
        }, txRepo.txSession);

        return { asset: updatedAsset, assignment: newAssignment };
      });
    } catch (err: unknown) {
      const error = err as Record<string, unknown>;
      if (error?.code === '23503') {
        throw new ValidationError('Invalid reference: User or Department does not exist');
      }
      throw error;
    }
  }

  /**
   * Returns an asset. Closes the active assignment and clears the assignment state on the asset.
   */
  async returnAsset(params: ReturnAssetParams) {
    const asset = await this.validateAssetForReturn(params.assetId);

    try {
      return await assetRepository.transaction(async (txRepo) => {
        const activeAssignment = await txRepo.getActiveAssignment(params.assetId);
        if (!activeAssignment) {
          throw new BusinessRuleError('Asset is not currently assigned.');
        }

        // Close assignment
        await txRepo.closeAssignment(activeAssignment.id);

        // Open new unassigned assignment
        const newAssignment = await txRepo.insertAssignment({
          assetId: params.assetId,
          assignmentType: 'unassigned',
          userId: null,
          departmentId: null,
          createdBy: params.actorUserId,
        });

        // Sync asset state
        const updatedAsset = await txRepo.updateWithVersion(params.assetId, params.version, {
          currentAssignedUserId: null,
          departmentId: null,
          assignmentType: 'unassigned',
        });

        if (!updatedAsset) {
          throw new ConflictError('Concurrency conflict: The asset was modified by someone else. Please refresh and try again.');
        }

        // Create Event
        const correlationId = crypto.randomUUID();

        await activityService.logEvent({
          assetId: params.assetId,
          eventType: 'RETURNED',
          category: 'ASSIGNMENT',
          severity: 'INFO',
          oldValue: asset,
          newValue: updatedAsset,
          actorUserId: params.actorUserId,
          actorNameSnapshot: params.actorNameSnapshot,
          note: params.note || 'Asset returned',
          correlationId,
        }, txRepo.txSession);

        await activityService.logAudit({
          entityType: 'asset',
          entityId: params.assetId.toString(),
          action: 'RETURN_ASSET',
          oldValue: asset,
          newValue: updatedAsset,
          actorId: params.actorUserId,
          correlationId,
        }, txRepo.txSession);

        return { asset: updatedAsset, assignment: newAssignment };
      });
    } catch (err: unknown) {
      const error = err as Record<string, unknown>;
      if (error?.code === '23503') {
        throw new ValidationError('Invalid reference: User or Department does not exist');
      }
      throw error;
    }
  }

  /**
   * Retrieves the full assignment history for an asset.
   */
  async getAssignmentHistory(assetId: number) {
    // Validate existence and tenant isolation
    await this.validateAssetForReturn(assetId); // Any existing asset can have its history checked
    return assetRepository.getAssignmentHistory(assetId);
  }
}

export const assignmentService = new AssignmentService();
