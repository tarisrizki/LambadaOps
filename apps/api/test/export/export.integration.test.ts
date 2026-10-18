import { describe, it, expect, beforeAll } from 'vitest';
import app from '../../src/index.js';
import { createTestTenant } from '../setup.integration.js';

describe('Export Domain Integration Tests', () => {
  let ctx: Awaited<ReturnType<typeof createTestTenant>>;
  let jobId: number;

  beforeAll(async () => {
    ctx = await createTestTenant();
  });

  it('POST /api/export > triggers an export job for assets', async () => {
    const payload = { entityType: 'assets' };

    const res = await app.request('/api/export', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ctx.token}`
      },
      body: JSON.stringify(payload)
    });

    expect(res.status).toBe(202);
    const json = await res.json() as any;
    expect(json.status).toBe('success');
    expect(json.data.id).toBeDefined();
    expect(json.data.status).toBe('pending');
    expect(json.data.entityType).toBe('assets');

    jobId = json.data.id;
  });

  it('GET /api/export/recent > retrieves recent export jobs', async () => {
    const res = await app.request('/api/export/recent', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ctx.token}`
      }
    });

    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.status).toBe('success');
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
    expect(json.data.some((job: any) => job.id === jobId)).toBe(true);
  });

  it('GET /api/export/:id > retrieves the export job status', async () => {
    const res = await app.request(`/api/export/${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ctx.token}`
      }
    });

    expect(res.status).toBe(200);
    const json = await res.json() as any;
    expect(json.status).toBe('success');
    expect(json.data.id).toBe(jobId);
    expect(json.data.entityType).toBe('assets');
  });


  it('GET /api/export/:id/download > allows download when job is completed', async () => {
    // We need to wait for the background job to finish
    let isCompleted = false;
    for (let i = 0; i < 20; i++) {
      const res = await app.request(`/api/export/${jobId}`, {
        headers: { 'Authorization': `Bearer ${ctx.token}` }
      });
      const json = await res.json() as any;
      if (json.data.status === 'completed' || json.data.status === 'failed') {
        expect(json.data.status).toBe('completed');
        isCompleted = true;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    expect(isCompleted).toBe(true);

    const downloadRes = await app.request(`/api/export/${jobId}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ctx.token}`
      }
    });

    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers.get('content-type')).toBe('text/csv');
    const content = await downloadRes.text();
    expect(content).toContain('ID'); // Standard CSV header
  });
});
