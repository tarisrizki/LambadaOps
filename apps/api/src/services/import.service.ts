import { importRepository } from '../repositories/import.repository.js';
import { assetRepository } from '../repositories/asset.repository.js';
import { assetService } from './asset.service.js';
import { NotFoundError } from '../lib/errors.js';
import { TenantContext } from '../lib/tenant-context.js';
import * as xlsx from 'xlsx';

export const importService = {
  async startImportJob(tenantId: number, uploadedById: number, filePath: string) {
    const job = await importRepository.createImportJob({
      tenantId,
      uploadedById,
      filePath,
      status: 'pending',
    });

    // Start background processing immediately, but don't await it
    this.processExcelImportJob(job!.id, tenantId, uploadedById, filePath).catch(console.error);

    return job!;
  },

  async processExcelImportJob(jobId: number, tenantId: number, actorUserId: number, filePath: string) {
    return TenantContext.run({ tenantId }, async () => {
      await importRepository.updateImportJob(jobId, { status: 'processing' });

      let workbook: xlsx.WorkBook;
      try {
        workbook = xlsx.readFile(filePath);
      } catch {
        await importRepository.updateImportJob(jobId, { 
          status: 'failed', 
          failedRows: 1, 
          totalRows: 0 
        });
        await importRepository.insertImportErrors([{
          importJobId: jobId,
          rowNumber: 0,
          errorMessage: 'Failed to read Excel file format',
          rawRowData: {},
        }]);
        return;
      }

      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        await importRepository.updateImportJob(jobId, { status: 'failed', failedRows: 1, totalRows: 0 });
        return;
      }
      const sheet = workbook.Sheets[sheetName]!;
      const rows = xlsx.utils.sheet_to_json(sheet) as Record<string, unknown>[];

      let successRows = 0;
      let failedRows = 0;
      const errors: Array<{ importJobId: number; rowNumber: number; errorMessage: string; rawRowData: unknown; field: string | null }> = [];

      // Pre-fetch categories and locations for mapping
      const categories = await assetRepository.getCategories();
      const locations = await assetRepository.getLocations();

      type CategoryRow = { name: string; id: number };
      type LocationRow = { name: string; id: number };
      const categoryMap = new Map<string, number>((categories as CategoryRow[]).map((c) => [c.name.toLowerCase(), c.id]));
      const locationMap = new Map<string, number>((locations as LocationRow[]).map((l) => [l.name.toLowerCase(), l.id]));

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]!;
        const rowNumber = i + 2; // Excel row number assuming header is row 1

        try {
          const name = row['Name'] || row['name'];
          const categoryName = row['Category'] || row['category'];
          const locationName = row['Location'] || row['location'];
          const brand = row['Brand'] || row['brand'];
          const serialNumber = row['Serial Number'] || row['serialNumber'];
          const assetCode = (row['Asset Code'] || row['assetCode']) as string | undefined;

          if (!name) throw new Error('Name is required');
          if (!categoryName) throw new Error('Category is required');
          if (!locationName) throw new Error('Location is required');

          const categoryId = categoryMap.get(String(categoryName).trim().toLowerCase());
          if (!categoryId) throw new Error(`Category not found: ${categoryName}`);

          const locationId = locationMap.get(String(locationName).trim().toLowerCase());
          if (!locationId) throw new Error(`Location not found: ${locationName}`);

          // Validate uniqueness if assetCode is provided
          if (assetCode) {
            const existing = await assetRepository.findByCode(assetCode);
            if (existing) throw new Error(`Asset Code already exists: ${assetCode}`);
          }

          const rawPurchasePrice = row['Purchase Price'];
          const purchasePrice = rawPurchasePrice ? String(Number(rawPurchasePrice)) : undefined;

          await assetService.createAsset({
            categoryId: categoryId as number,
            locationId: locationId as number,
            name: String(name),
            brand: brand ? String(brand) : undefined,
            serialNumber: serialNumber ? String(serialNumber) : undefined,
            purchasePrice,
            condition: (row['Condition'] as 'good' | 'fair' | 'poor' | undefined) || 'good',
            status: (row['Status'] as 'active' | 'repair' | 'lost' | 'retired' | 'disposed' | undefined) || 'active',
          }, actorUserId, `Import Job ${jobId}`);

          successRows++;
        } catch (err: unknown) {
          failedRows++;
          const msg = err instanceof Error ? err.message : 'Unknown error';
          errors.push({
            importJobId: jobId,
            rowNumber,
            field: null,
            errorMessage: msg.substring(0, 999),
            rawRowData: row,
          });
        }
      }

      await importRepository.insertImportErrors(errors);
      await importRepository.updateImportJob(jobId, {
        status: 'completed',
        totalRows: rows.length,
        successRows,
        failedRows,
      });
    });
  },

  async getImportJob(jobId: number) {
    const job = await importRepository.getImportJob(jobId);
    if (!job) throw new NotFoundError('Import Job');
    return job;
  },

  async getImportJobs(tenantId: number) {
    return await importRepository.getImportJobs(tenantId);
  },

  async getImportErrors(jobId: number) {
    return await importRepository.getImportErrors(jobId);
  }
};
