import { exportRepository } from '../repositories/export.repository.js';
import { assetRepository } from '../repositories/asset.repository.js';
import { ticketRepository } from '../repositories/ticket.repository.js';
import { NotFoundError, BusinessRuleError } from '../lib/errors.js';
import { TenantContext } from '../lib/tenant-context.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';

export const exportService = {
  async startExportJob(tenantId: number, requestedById: number, entityType: 'assets' | 'tickets') {
    if (entityType !== 'assets' && entityType !== 'tickets') {
      throw new BusinessRuleError('Invalid entity type for export');
    }

    const job = await exportRepository.createExportJob({
      requestedById,
      entityType,
      status: 'pending',
    });

    // Start background processing asynchronously
    this.processExportJob(job.id, tenantId, entityType).catch(console.error);

    return job;
  },

  async processExportJob(jobId: number, tenantId: number, entityType: 'assets' | 'tickets') {
    return TenantContext.run({ tenantId }, async () => {
      await exportRepository.updateExportJob(jobId, { status: 'processing' });

      try {
        let headers: string[] = [];
        let rows: string[][] = [];

        if (entityType === 'assets') {
          const assets = await assetRepository.findAll();
          headers = ['ID', 'Asset Code', 'Name', 'Brand', 'Serial Number', 'Status', 'Condition', 'Purchase Date', 'Warranty End'];
          rows = assets.map(a => [
            a.id.toString(),
            a.assetCode,
            a.name,
            a.brand || '',
            a.serialNumber || '',
            a.status,
            a.condition,
            a.purchaseDate || '',
            a.warrantyEnd || '',
          ]);
        } else if (entityType === 'tickets') {
          const tickets = await ticketRepository.findAllTickets();
          headers = ['ID', 'Title', 'Status', 'Priority', 'Category', 'Created At'];
          rows = tickets.map(t => [
            t.id.toString(),
            t.title,
            t.status,
            t.priority,
            t.category,
            t.createdAt.toISOString(),
          ]);
        }

        // Generate CSV string
        const escapeCsv = (val: string) => `"${val.replace(/"/g, '""')}"`;
        const csvContent = [
          headers.map(escapeCsv).join(','),
          ...rows.map(row => row.map(escapeCsv).join(','))
        ].join('\n');

        // Write to temporary local file (Mocking S3 behavior)
        const fileName = `export_${tenantId}_${entityType}_${Date.now()}.csv`;
        const tmpDir = os.tmpdir();
        const filePath = path.join(tmpDir, fileName);
        await fs.writeFile(filePath, csvContent, 'utf-8');

        // Store the local path in fileUrl for the MVP mock download endpoint
        const fileUrl = filePath;

        await exportRepository.updateExportJob(jobId, {
          status: 'completed',
          totalRows: rows.length,
          fileUrl,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        await exportRepository.updateExportJob(jobId, {
          status: 'failed',
          errorMessage: message.substring(0, 999),
        });
      }
    });
  },

  async getExportJob(jobId: number) {
    const job = await exportRepository.getExportJobById(jobId);
    if (!job) throw new NotFoundError('Export Job');
    return job;
  },

  async getRecentExportJobs() {
    return await exportRepository.getRecentExportJobs();
  }
};
