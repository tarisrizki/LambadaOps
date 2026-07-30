import crypto from 'node:crypto';
import { attachmentRepository } from '../repositories/attachment.repository.js';
import { assetRepository } from '../repositories/asset.repository.js';
import { BusinessRuleError, NotFoundError } from '../lib/errors.js';
import type { StorageProvider } from '../providers/storage/storage.provider.js';
import { TenantContext } from '../lib/tenant-context.js';
import { activityService } from './activity.service.js';

export type UploadAttachmentParams = {
  assetId: number;
  originalFileName: string;
  mimeType: string;
  fileBuffer: Buffer;
  attachmentType: 'photo' | 'invoice' | 'manual' | 'certificate' | 'warranty' | 'other';
  actorUserId: number;
  actorNameSnapshot: string;
};

export class AttachmentService {
  constructor(private storageProvider: StorageProvider) {}

  /**
   * Retrieves an asset and ensures it is active and belongs to the current tenant.
   * assetRepository internally applies the Tenant isolation filter.
   */
  private async getValidAsset(assetId: number) {
    const asset = await assetRepository.findById(assetId);
    if (!asset) {
      throw new NotFoundError('Asset not found');
    }
    if (asset.status === 'disposed' || asset.status === 'retired') {
      throw new BusinessRuleError('Cannot attach files to a disposed or retired asset');
    }
    return asset;
  }

  /**
   * Uploads an attachment.
   * Workflow:
   * 1. Validate asset exists and belongs to tenant
   * 2. Generate storage key
   * 3. Upload to storage
   * 4. Open Transaction: Insert metadata + Create Event
   */
  async uploadAttachment(params: UploadAttachmentParams) {
    const { assetId, fileBuffer, originalFileName, mimeType, attachmentType, actorUserId, actorNameSnapshot } = params;

    const asset = await this.getValidAsset(assetId);
    const tenantId = TenantContext.getTenantId();

    const fileUuid = crypto.randomUUID();
    const extMatch = originalFileName.match(/\.([a-z0-9]+)$/i);
    const ext = extMatch ? `.${extMatch[1]}` : '';
    const storageKey = `tenants/${tenantId}/assets/${assetId}/attachments/${fileUuid}${ext}`;
    const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    // 1. Upload to storage (Outside of DB transaction)
    await this.storageProvider.upload(storageKey, fileBuffer, mimeType);

    // 2. Persist metadata and emit event (Inside DB transaction)
    try {
      return await assetRepository.transaction(async (txRepo) => {
        const attachmentRepoTx = attachmentRepository.withTx(txRepo.txSession);

        const metadata = await attachmentRepoTx.create({
          assetId,
          originalFileName,
          storageKey,
          mimeType,
          fileSize: fileBuffer.length,
          checksum,
          attachmentType,
          uploadedBy: actorUserId,
        });

        const correlationId = crypto.randomUUID();

        await activityService.logEvent({
          assetId,
          eventType: 'ATTACHMENT_UPLOADED',
          category: 'ATTACHMENT',
          severity: 'INFO',
          oldValue: null,
          newValue: {
            attachmentId: metadata.id,
            originalFileName: metadata.originalFileName,
            mimeType: metadata.mimeType,
            fileSize: metadata.fileSize,
            checksum: metadata.checksum,
            storageKey: metadata.storageKey,
            attachmentType: metadata.attachmentType,
          },
          actorUserId,
          actorNameSnapshot,
          note: `Uploaded ${attachmentType}: ${originalFileName}`,
          correlationId,
        }, txRepo.txSession);

        await activityService.logAudit({
          entityType: 'asset_attachment',
          entityId: metadata.id.toString(),
          action: 'UPLOAD_ATTACHMENT',
          oldValue: null,
          newValue: metadata,
          actorId: actorUserId,
          correlationId,
        }, txRepo.txSession);

        return metadata;
      });
    } catch (dbError) {
      // 3. Upload Failure Recovery: Immediately attempt to delete from storage if DB fails
      try {
        await this.storageProvider.delete(storageKey);
      } catch (deleteErr) {
        console.error(`[CRITICAL] Orphan file in storage! Failed to delete ${storageKey} after DB transaction rollback. Cleanup job required.`, deleteErr);
      }
      throw dbError; // Rethrow original error so the user gets 500/400
    }
  }

  /**
   * Deletes an attachment.
   * Workflow:
   * 1. Validate asset and attachment
   * 2. Delete from storage
   * 3. Open Transaction: Soft delete metadata + Create Event
   */
  async deleteAttachment(attachmentId: number, assetId: number, actorUserId: number, actorNameSnapshot: string) {
    const asset = await this.getValidAsset(assetId);
    
    const attachment = await attachmentRepository.findById(attachmentId, assetId);
    if (!attachment) {
      throw new NotFoundError('Attachment not found');
    }

    // 1. Soft delete metadata and emit event (Inside DB transaction)
    const deletedAttachment = await assetRepository.transaction(async (txRepo) => {
      const attachmentRepoTx = attachmentRepository.withTx(txRepo.txSession);

      const deletedMetadata = await attachmentRepoTx.softDelete(attachmentId, assetId);
      if (!deletedMetadata) {
        throw new NotFoundError('Attachment could not be deleted or already deleted');
      }

      const correlationId = crypto.randomUUID();

      await activityService.logEvent({
        assetId,
        eventType: 'ATTACHMENT_DELETED',
        category: 'ATTACHMENT',
        severity: 'NOTICE',
        oldValue: {
          attachmentId: attachment.id,
          originalFileName: attachment.originalFileName,
          mimeType: attachment.mimeType,
          fileSize: attachment.fileSize,
          checksum: attachment.checksum,
          storageKey: attachment.storageKey,
          attachmentType: attachment.attachmentType,
        },
        newValue: null,
        actorUserId,
        actorNameSnapshot,
        note: `Deleted ${attachment.attachmentType}: ${attachment.originalFileName}`,
        correlationId,
      }, txRepo.txSession);

      await activityService.logAudit({
        entityType: 'asset_attachment',
        entityId: attachment.id.toString(),
        action: 'DELETE_ATTACHMENT',
        oldValue: attachment,
        newValue: null,
        actorId: actorUserId,
        correlationId,
      }, txRepo.txSession);

      return deletedMetadata;
    });

    // 2. Delete from storage (Outside of DB transaction)
    try {
      await this.storageProvider.delete(attachment.storageKey);
    } catch (err) {
      console.error(`[CRITICAL] Orphan file in storage! Failed to delete ${attachment.storageKey} from storage after DB deletion. Cleanup job required.`, err);
    }

    return deletedAttachment;
  }

  /**
   * Generates a presigned URL for downloading the attachment securely.
   */
  async getDownloadUrl(attachmentId: number, assetId: number, expiresInSec: number = 900) {
    // Validate asset to ensure tenant isolation check passes
    await this.getValidAsset(assetId);

    const attachment = await attachmentRepository.findById(attachmentId, assetId);
    if (!attachment) {
      throw new NotFoundError('Attachment not found');
    }

    const url = await this.storageProvider.getPresignedDownloadUrl(attachment.storageKey, expiresInSec);
    return { url, originalFileName: attachment.originalFileName };
  }

  /**
   * Lists all attachments for a given asset
   */
  async listAttachments(assetId: number) {
    await this.getValidAsset(assetId);
    return await attachmentRepository.findAllByAsset(assetId);
  }
}

// In a real app, you would inject R2StorageProvider based on env.
// For now, we inject MockStorageProvider to fulfill the acceptance criteria safely.
import { MockStorageProvider } from '../providers/storage/mock-storage.provider.js';
export const attachmentService = new AttachmentService(new MockStorageProvider());
