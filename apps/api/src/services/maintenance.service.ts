import { maintenanceRepository } from '../repositories/maintenance.repository.js';
import { assetRepository } from '../repositories/asset.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { activityService } from './activity.service.js';
import { notificationService } from './notification.service.js';
import { BusinessRuleError, NotFoundError, ConflictError } from '../lib/errors.js';
import { SystemRoles } from '../lib/auth/roles.js';
import { TenantContext } from '../lib/tenant-context.js';
import crypto from 'node:crypto';

export interface ScheduleMaintenanceParams {
  assetId: number;
  title: string;
  description?: string;
  scheduledDate?: Date;
  technicianId?: number;
  actorUserId: number;
  actorNameSnapshot: string;
}

export interface MaintenanceActionParams {
  jobId: number;
  version: number;
  actorUserId: number;
  actorNameSnapshot: string;
  note?: string;
}

export interface CompleteMaintenanceParams extends MaintenanceActionParams {
  laborCost?: number;
  vendorCost?: number;
  taxAmount?: number;
  discountAmount?: number;
}

export interface AddPartParams {
  jobId: number;
  partName: string;
  partNumber?: string;
  quantity: number;
  unitCost: number;
  actorUserId: number;
  actorNameSnapshot: string;
}

export class MaintenanceService {
  /**
   * Schedules a new maintenance job.
   */
  async scheduleMaintenance(params: ScheduleMaintenanceParams) {
    const asset = await assetRepository.findById(params.assetId);
    if (!asset) throw new NotFoundError('Asset');
    if (asset.deletedAt) throw new BusinessRuleError('Cannot maintain a deleted asset.');

    return await maintenanceRepository.transaction(async (txRepo) => {
      const job = await txRepo.createJob({
        assetId: params.assetId,
        title: params.title,
        description: params.description || null,
        scheduledDate: params.scheduledDate ? params.scheduledDate.toISOString() : null,
        technicianId: params.technicianId || null,
        status: 'scheduled',
      });

      const correlationId = crypto.randomUUID();
      
      await activityService.logEvent({
        assetId: params.assetId,
        eventType: 'MAINTENANCE_SCHEDULED',
        category: 'MAINTENANCE',
        severity: 'INFO',
        oldValue: null,
        newValue: job,
        actorUserId: params.actorUserId,
        actorNameSnapshot: params.actorNameSnapshot,
        note: 'Maintenance scheduled',
        correlationId,
      }, txRepo.txSession);

      await activityService.logAudit({
        entityType: 'maintenance_job',
        entityId: job.id.toString(),
        action: 'SCHEDULE',
        oldValue: null,
        newValue: job,
        actorId: params.actorUserId,
        correlationId,
      }, txRepo.txSession);

      return job;
    });
  }

  /**
   * Starts a maintenance job.
   */
  async startMaintenance(params: MaintenanceActionParams) {
    const job = await maintenanceRepository.findJobById(params.jobId);
    if (!job) throw new NotFoundError('Maintenance Job');
    if (job.status !== 'scheduled' && job.status !== 'ready') {
      throw new BusinessRuleError('Maintenance can only be started from scheduled or ready state.');
    }

    const asset = await assetRepository.findById(job.assetId);
    if (!asset) throw new NotFoundError('Asset');

    return await maintenanceRepository.transaction(async (txRepo) => {
      const updatedJob = await txRepo.updateJobWithVersion(params.jobId, params.version, {
        status: 'in_progress',
        startedAt: new Date(),
      });
      if (!updatedJob) throw new ConflictError('Concurrency conflict on Maintenance Job.');

      const assetTx = assetRepository.withTx(txRepo.txSession);
      const updatedAsset = await assetTx.updateWithVersion(asset.id, asset.version, {
        status: 'repair', // 'repair' maps to UNDER_MAINTENANCE in business logic
      });
      if (!updatedAsset) throw new ConflictError('Concurrency conflict on Asset.');

      const correlationId = crypto.randomUUID();

      await activityService.logEvent({
        assetId: job.assetId,
        eventType: 'MAINTENANCE_STARTED',
        category: 'MAINTENANCE',
        severity: 'INFO',
        oldValue: job,
        newValue: updatedJob,
        actorUserId: params.actorUserId,
        actorNameSnapshot: params.actorNameSnapshot,
        note: params.note || 'Maintenance started',
        correlationId,
      }, txRepo.txSession);

      await activityService.logAudit({
        entityType: 'maintenance_job',
        entityId: job.id.toString(),
        action: 'START',
        oldValue: job,
        newValue: updatedJob,
        actorId: params.actorUserId,
        correlationId,
      }, txRepo.txSession);

      return { job: updatedJob, asset: updatedAsset };
    });
  }

  /**
   * Pauses an active maintenance job.
   */
  async pauseMaintenance(params: MaintenanceActionParams) {
    const job = await maintenanceRepository.findJobById(params.jobId);
    if (!job) throw new NotFoundError('Maintenance Job');
    if (job.status !== 'in_progress') {
      throw new BusinessRuleError('Only in-progress maintenance can be paused.');
    }

    return await maintenanceRepository.transaction(async (txRepo) => {
      const updatedJob = await txRepo.updateJobWithVersion(params.jobId, params.version, {
        status: 'paused',
      });
      if (!updatedJob) throw new ConflictError('Concurrency conflict on Maintenance Job.');

      const correlationId = crypto.randomUUID();

      await activityService.logEvent({
        assetId: job.assetId,
        eventType: 'MAINTENANCE_PAUSED',
        category: 'MAINTENANCE',
        severity: 'NOTICE',
        oldValue: job,
        newValue: updatedJob,
        actorUserId: params.actorUserId,
        actorNameSnapshot: params.actorNameSnapshot,
        note: params.note || 'Maintenance paused',
        correlationId,
      }, txRepo.txSession);

      await activityService.logAudit({
        entityType: 'maintenance_job',
        entityId: job.id.toString(),
        action: 'PAUSE',
        oldValue: job,
        newValue: updatedJob,
        actorId: params.actorUserId,
        correlationId,
      }, txRepo.txSession);

      return updatedJob;
    });
  }

  /**
   * Resumes a paused maintenance job.
   */
  async resumeMaintenance(params: MaintenanceActionParams) {
    const job = await maintenanceRepository.findJobById(params.jobId);
    if (!job) throw new NotFoundError('Maintenance Job');
    if (job.status !== 'paused') {
      throw new BusinessRuleError('Only paused maintenance can be resumed.');
    }

    return await maintenanceRepository.transaction(async (txRepo) => {
      const updatedJob = await txRepo.updateJobWithVersion(params.jobId, params.version, {
        status: 'in_progress',
      });
      if (!updatedJob) throw new ConflictError('Concurrency conflict on Maintenance Job.');

      const correlationId = crypto.randomUUID();

      await activityService.logEvent({
        assetId: job.assetId,
        eventType: 'MAINTENANCE_RESUMED',
        category: 'MAINTENANCE',
        severity: 'INFO',
        oldValue: job,
        newValue: updatedJob,
        actorUserId: params.actorUserId,
        actorNameSnapshot: params.actorNameSnapshot,
        note: params.note || 'Maintenance resumed',
        correlationId,
      }, txRepo.txSession);

      await activityService.logAudit({
        entityType: 'maintenance_job',
        entityId: job.id.toString(),
        action: 'RESUME',
        oldValue: job,
        newValue: updatedJob,
        actorId: params.actorUserId,
        correlationId,
      }, txRepo.txSession);

      return updatedJob;
    });
  }

  /**
   * Completes a maintenance job. Finalizes costs and sets asset status back to active.
   */
  async completeMaintenance(params: CompleteMaintenanceParams) {
    const job = await maintenanceRepository.findJobById(params.jobId);
    if (!job) throw new NotFoundError('Maintenance Job');
    if (job.status !== 'in_progress') {
      throw new BusinessRuleError('Only in-progress maintenance can be completed.');
    }

    const asset = await assetRepository.findById(job.assetId);
    if (!asset) throw new NotFoundError('Asset');

    return await maintenanceRepository.transaction(async (txRepo) => {
      // Aggregate parts cost
      const parts = await txRepo.getPartsByJob(params.jobId);
      const partsCost = parts.reduce((sum, p) => sum + Number(p.totalCost), 0);

      const laborCost = params.laborCost ?? Number(job.laborCost ?? 0);
      const vendorCost = params.vendorCost ?? Number(job.vendorCost ?? 0);
      const taxAmount = params.taxAmount ?? Number(job.taxAmount ?? 0);
      const discountAmount = params.discountAmount ?? Number(job.discountAmount ?? 0);

      const totalCost = laborCost + partsCost + vendorCost + taxAmount - discountAmount;

      const updatedJob = await txRepo.updateJobWithVersion(params.jobId, params.version, {
        status: 'completed',
        completedAt: new Date(),
        laborCost: laborCost.toFixed(2),
        partsCost: partsCost.toFixed(2),
        vendorCost: vendorCost.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        totalCost: totalCost.toFixed(2),
      });
      if (!updatedJob) throw new ConflictError('Concurrency conflict on Maintenance Job.');

      const assetTx = assetRepository.withTx(txRepo.txSession);
      const updatedAsset = await assetTx.updateWithVersion(asset.id, asset.version, {
        status: 'active', // Assuming it returns to active. In a real app, it might return to its previous state.
      });
      if (!updatedAsset) throw new ConflictError('Concurrency conflict on Asset.');

      const correlationId = crypto.randomUUID();

      await activityService.logEvent({
        assetId: job.assetId,
        eventType: 'MAINTENANCE_FINISHED',
        category: 'MAINTENANCE',
        severity: 'INFO',
        oldValue: job,
        newValue: updatedJob,
        actorUserId: params.actorUserId,
        actorNameSnapshot: params.actorNameSnapshot,
        note: params.note || 'Maintenance completed',
        correlationId,
      }, txRepo.txSession);

      await activityService.logAudit({
        entityType: 'maintenance_job',
        entityId: job.id.toString(),
        action: 'COMPLETE',
        oldValue: job,
        newValue: updatedJob,
        actorId: params.actorUserId,
        correlationId,
      }, txRepo.txSession);

      return { job: updatedJob, asset: updatedAsset };
    });
  }

  /**
   * Cancels a maintenance job.
   */
  async cancelMaintenance(params: MaintenanceActionParams) {
    const job = await maintenanceRepository.findJobById(params.jobId);
    if (!job) throw new NotFoundError('Maintenance Job');
    if (job.status === 'completed' || job.status === 'cancelled') {
      throw new BusinessRuleError('Maintenance is already completed or cancelled.');
    }

    const asset = await assetRepository.findById(job.assetId);
    if (!asset) throw new NotFoundError('Asset');

    return await maintenanceRepository.transaction(async (txRepo) => {
      const updatedJob = await txRepo.updateJobWithVersion(params.jobId, params.version, {
        status: 'cancelled',
      });
      if (!updatedJob) throw new ConflictError('Concurrency conflict on Maintenance Job.');

      // If it was in progress or paused, we revert asset back to active
      let updatedAsset = asset;
      if (job.status === 'in_progress' || job.status === 'paused') {
        const assetTx = assetRepository.withTx(txRepo.txSession);
        const revertedAsset = await assetTx.updateWithVersion(asset.id, asset.version, {
          status: 'active',
        });
        if (!revertedAsset) throw new ConflictError('Concurrency conflict on Asset.');
        updatedAsset = revertedAsset;
      }

      const correlationId = crypto.randomUUID();

      await activityService.logEvent({
        assetId: job.assetId,
        eventType: 'MAINTENANCE_CANCELLED',
        category: 'MAINTENANCE',
        severity: 'WARNING',
        oldValue: job,
        newValue: updatedJob,
        actorUserId: params.actorUserId,
        actorNameSnapshot: params.actorNameSnapshot,
        note: params.note || 'Maintenance cancelled',
        correlationId,
      }, txRepo.txSession);

      await activityService.logAudit({
        entityType: 'maintenance_job',
        entityId: job.id.toString(),
        action: 'CANCEL',
        oldValue: job,
        newValue: updatedJob,
        actorId: params.actorUserId,
        correlationId,
      }, txRepo.txSession);

      return { job: updatedJob, asset: updatedAsset };
    });
  }

  /**
   * Adds a part to a maintenance job.
   */
  async addPart(params: AddPartParams) {
    const job = await maintenanceRepository.findJobById(params.jobId);
    if (!job) throw new NotFoundError('Maintenance Job');
    if (job.status === 'completed' || job.status === 'cancelled') {
      throw new BusinessRuleError('Cannot add parts to a completed or cancelled maintenance.');
    }

    return await maintenanceRepository.transaction(async (txRepo) => {
      const part = await txRepo.addPart({
        maintenanceJobId: params.jobId,
        partName: params.partName,
        partNumber: params.partNumber || null,
        quantity: params.quantity,
        unitCost: params.unitCost.toFixed(2),
      });

      const correlationId = crypto.randomUUID();

      await activityService.logEvent({
        assetId: job.assetId,
        eventType: 'MAINTENANCE_PART_ADDED',
        category: 'MAINTENANCE',
        severity: 'INFO',
        oldValue: null,
        newValue: part,
        actorUserId: params.actorUserId,
        actorNameSnapshot: params.actorNameSnapshot,
        note: `Added part: ${part.partName} x${part.quantity}`,
        correlationId,
      }, txRepo.txSession);

      await activityService.logAudit({
        entityType: 'maintenance_part',
        entityId: part.id.toString(),
        action: 'ADD_PART',
        oldValue: null,
        newValue: part,
        actorId: params.actorUserId,
        correlationId,
      }, txRepo.txSession);

      return part;
    });
  }

  /**
   * Adds a note to a maintenance job.
   */
  async addNote(jobId: number, noteText: string, actorUserId: number, actorNameSnapshot: string) {
    const job = await maintenanceRepository.findJobById(jobId);
    if (!job) throw new NotFoundError('Maintenance Job');

    return await maintenanceRepository.transaction(async (txRepo) => {
      const note = await txRepo.addNote({
        maintenanceJobId: jobId,
        authorId: actorUserId,
        note: noteText,
      });

      const correlationId = crypto.randomUUID();

      await activityService.logEvent({
        assetId: job.assetId,
        eventType: 'MAINTENANCE_NOTE_ADDED',
        category: 'MAINTENANCE',
        severity: 'INFO',
        oldValue: null,
        newValue: note,
        actorUserId,
        actorNameSnapshot,
        note: 'Note added to maintenance',
        correlationId,
      }, txRepo.txSession);

      await activityService.logAudit({
        entityType: 'maintenance_note',
        entityId: note.id.toString(),
        action: 'ADD_NOTE',
        oldValue: null,
        newValue: note,
        actorId: actorUserId,
        correlationId,
      }, txRepo.txSession);

      return note;
    });
  }

  /**
   * Triggers notifications for maintenance jobs due within 7 days.
   * In a real application, this would be called by a cron job globally or per-tenant.
   */
  async triggerDueNotifications(tenantId: number) {
    return TenantContext.run({ tenantId }, async () => {
      // Find jobs due within 7 days
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 7);

      const jobs = await maintenanceRepository.findScheduledJobs();

      let notifiedCount = 0;

      // Filter jobs due soon
      for (const job of jobs) {
        if (job.status !== 'scheduled' || !job.scheduledDate) continue;
        const scheduledDate = new Date(job.scheduledDate);
        if (scheduledDate <= targetDate) {
          // Notify
          if (job.technicianId) {
            await notificationService.createNotification({
              tenantId,
              userId: job.technicianId,
              type: 'maintenance_due',
              title: 'Maintenance Due Soon',
              message: `Maintenance "${job.title}" is due on ${job.scheduledDate}.`,
              actionUrl: `/maintenance/${job.id}`
            });
            notifiedCount++;
          } else {
            // Send to all IT Managers
            const allUsers = await userRepository.findAll();
            const itManagers = allUsers.filter(u => u.roleId === SystemRoles.IT_MANAGER);
            for (const manager of itManagers) {
              await notificationService.createNotification({
                tenantId,
                userId: manager.id,
                type: 'maintenance_due',
                title: 'Maintenance Due Soon (Unassigned)',
                message: `Unassigned maintenance "${job.title}" is due on ${job.scheduledDate}.`,
                actionUrl: `/maintenance/${job.id}`
              });
              notifiedCount++;
            }
          }
        }
      }

      return { notifiedCount };
    });
  }
}

export const maintenanceService = new MaintenanceService();
