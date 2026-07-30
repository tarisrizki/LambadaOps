import { describe, it, expect, beforeAll } from 'vitest';
import app from '../../src/index.js';
import crypto from 'node:crypto';
import { createTestTenant } from '../setup.integration.js';
import { db } from '../../src/db/index.js';
import { assets, assetEvents } from '../../src/db/schema/asset.schema.js';
import { maintenanceJobs, maintenanceParts, maintenanceNotes } from '../../src/db/schema/maintenance.schema.js';
import { eq, desc } from 'drizzle-orm';

describe('Maintenance Domain Integration Tests', () => {
  let ctx: Awaited<ReturnType<typeof createTestTenant>>;
  let assetId: number;
  let jobId: number;
  let jobVersion: number;

  beforeAll(async () => {
    ctx = await createTestTenant();

    // Seed an asset directly for maintenance tests
    const [asset] = await db.insert(assets).values({
      tenantId: ctx.tenant.id,
      name: 'Test Asset for Maintenance',
      categoryId: ctx.category.id,
      locationId: ctx.location.id,
      assetCode: `TEST-${crypto.randomUUID().split('-')[0]}`,
      qrCodeToken: crypto.randomUUID(),
      status: 'active',
    }).returning();
    
    assetId = asset.id;
  });

  describe('POST /api/maintenance', () => {
    it('schedules a new maintenance job', async () => {
      const payload = {
        assetId,
        title: 'Quarterly Checkup',
        description: 'Check battery and screen',
      };

      const res = await app.request('/api/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ctx.token}`,
        },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.status).toBe('success');
      expect(json.data.assetId).toBe(assetId);
      expect(json.data.status).toBe('scheduled');
      
      jobId = json.data.id;
      jobVersion = json.data.version;

      // Verify activity log
      const events = await db.select().from(assetEvents)
        .where(eq(assetEvents.assetId, assetId))
        .orderBy(desc(assetEvents.createdAt));
      
      expect(events[0].eventType).toBe('MAINTENANCE_SCHEDULED');
    });
  });

  describe('GET /api/maintenance/:id', () => {
    it('retrieves the scheduled maintenance job', async () => {
      const res = await app.request(`/api/maintenance/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ctx.token}`,
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.id).toBe(jobId);
      expect(json.data.status).toBe('scheduled');
      expect(json.data.parts).toEqual([]);
      expect(json.data.notes).toEqual([]);
    });
  });

  describe('POST /api/maintenance/:id/start', () => {
    it('starts the maintenance job and updates asset status to repair', async () => {
      const payload = {
        version: jobVersion,
        note: 'Starting work',
      };

      const res = await app.request(`/api/maintenance/${jobId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ctx.token}`,
        },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.job.status).toBe('in_progress');
      expect(json.data.asset.status).toBe('repair');
      
      jobVersion = json.data.job.version;
    });
  });

  describe('POST /api/maintenance/:id/parts', () => {
    it('adds a part to the maintenance job', async () => {
      const payload = {
        partName: 'New Battery',
        quantity: 1,
        unitCost: 150.00,
      };

      const res = await app.request(`/api/maintenance/${jobId}/parts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ctx.token}`,
        },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.partName).toBe('New Battery');
      expect(json.data.unitCost).toBe('150.00'); // Numeric types often come back as strings from pg
    });
  });

  describe('POST /api/maintenance/:id/notes', () => {
    it('adds a note to the maintenance job', async () => {
      const payload = {
        note: 'Battery replaced successfully',
      };

      const res = await app.request(`/api/maintenance/${jobId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ctx.token}`,
        },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.note).toBe('Battery replaced successfully');
    });
  });

  describe('POST /api/maintenance/:id/complete', () => {
    it('completes the maintenance job, aggregates costs, and restores asset status', async () => {
      const payload = {
        version: jobVersion,
        laborCost: 100, // 100 labor + 150 parts = 250 total
      };

      const res = await app.request(`/api/maintenance/${jobId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ctx.token}`,
        },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.job.status).toBe('completed');
      expect(json.data.job.laborCost).toBe('100.00');
      expect(json.data.job.partsCost).toBe('150.00');
      expect(json.data.job.totalCost).toBe('250.00');
      expect(json.data.asset.status).toBe('active');
    });
  });
});
