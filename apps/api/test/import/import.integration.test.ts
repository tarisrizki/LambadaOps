import { describe, it, expect, beforeAll } from 'vitest';
import app from '../../src/index.js';
import { db } from '../../src/db/index.js';
import { createTestTenant } from '../setup.integration.js';
import * as xlsx from 'xlsx';
import { importJobs, importErrors } from '../../src/db/schema/import-export.schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'node:crypto';
import { importService } from '../../src/services/import.service.js';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { writeFile } from 'node:fs/promises';

describe('Excel Import Integration Tests', () => {
  let ctx: Awaited<ReturnType<typeof createTestTenant>>;
  let jobId: number;
  let excelFilePath: string;

  beforeAll(async () => {
    ctx = await createTestTenant();
  });

  const createTestExcelBuffer = (data: any[]) => {
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return buf;
  };

  it('starts an import job using the service', async () => {
    const excelData = [
      {
        'Name': 'Laptop A',
        'Category': 'IT Equipment',
        'Location': 'Headquarters',
        'Brand': 'Dell',
        'Serial Number': 'SN12345',
        'Asset Code': `AST-1-${crypto.randomUUID()}`
      },
      {
        'Name': 'Laptop B',
        'Category': 'NonExistentCategory', // Should fail
        'Location': 'Headquarters',
      }
    ];

    const buffer = createTestExcelBuffer(excelData);
    excelFilePath = join(tmpdir(), `test-import-${crypto.randomUUID()}.xlsx`);
    await writeFile(excelFilePath, buffer);

    const job = await importService.startImportJob(ctx.tenant.id, ctx.user.id, excelFilePath);
    expect(job).toBeDefined();
    expect(job.status).toBe('pending');
    jobId = job.id;
  });

  it('processes the job in the background (mock wait)', async () => {
    // Wait for async job to finish (max 2 seconds)
    for (let i = 0; i < 20; i++) {
      const res = await app.request(`/api/import/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${ctx.token}`
        }
      });
      const json = await res.json() as any;
      if (json.data.status === 'completed' || json.data.status === 'failed') {
        expect(json.data.status).toBe('completed');
        expect(json.data.totalRows).toBe(2);
        expect(json.data.successRows).toBe(1);
        expect(json.data.failedRows).toBe(1);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error('Timeout waiting for job to complete');
  });

  it('retrieves import errors for failed rows', async () => {
    const res = await app.request(`/api/import/jobs/${jobId}/errors`, {
      headers: {
        'Authorization': `Bearer ${ctx.token}`
      }
    });

    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.data.length).toBe(1);
    expect(json.data[0].errorMessage).toContain('Category not found: NonExistentCategory');
  });
});
