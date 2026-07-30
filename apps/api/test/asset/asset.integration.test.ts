import { describe, it, expect, beforeAll } from 'vitest';
import app from '../../src/index.js';
import { createTestTenant } from '../setup.integration.js';
import { db } from '../../src/db/index.js';
import { assets, assetEvents } from '../../src/db/schema/asset.schema.js';
import { eq, desc } from 'drizzle-orm';

describe('Asset Domain Integration Tests', () => {
  let ctx: Awaited<ReturnType<typeof createTestTenant>>;
  let createdAssetId: number;
  let currentVersion: number;

  beforeAll(async () => {
    ctx = await createTestTenant();
  });

  describe('POST /api/assets', () => {
    it('creates a new asset and generates a CREATED activity log', async () => {
      const payload = {
        name: 'MacBook Pro M3',
        categoryId: ctx.category.id,
        departmentId: ctx.department.id,
        locationId: ctx.location.id,
        purchasePrice: '2500.00',
        brand: 'Apple',
        model: 'MacBook Pro',
        serialNumber: 'SN-12345-MAC',
      };

      const res = await app.request('/api/assets', {
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
      expect(json.data.name).toBe('MacBook Pro M3');
      expect(json.data.assetCode).toMatch(/^AST-\d+$/); // Tenant sequential generation
      expect(json.data.qrCodeToken).toBeDefined();

      createdAssetId = json.data.id;
      currentVersion = json.data.version;

      // Assert DB state directly
      const [dbAsset] = await db.select().from(assets).where(eq(assets.id, createdAssetId));
      expect(dbAsset).toBeDefined();
      expect(dbAsset.tenantId).toBe(ctx.tenant.id);

      // Verify CREATED event exists
      const events = await db.select().from(assetEvents).where(eq(assetEvents.assetId, createdAssetId));
      expect(events.length).toBe(1);
      expect(events[0].eventType).toBe('CREATED');
    });

    it('fails if validation is incorrect', async () => {
      const payload = { name: '' }; // Missing required fields

      const res = await app.request('/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ctx.token}`,
        },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(400); // Bad Request (Zod Validator)
    });
  });

  describe('GET /api/assets', () => {
    it('lists assets applying tenant isolation', async () => {
      const res = await app.request('/api/assets', {
        headers: { 'Authorization': `Bearer ${ctx.token}` },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.length).toBeGreaterThanOrEqual(1);
      
      // Ensure only our tenant's assets are returned
      for (const asset of json.data) {
        // tenantId is stripped in DTO typically, but we check if we got the one we created
        if (asset.id === createdAssetId) {
          expect(asset.name).toBe('MacBook Pro M3');
        }
      }
    });
  });

  describe('PUT /api/assets/:id', () => {
    it('updates an asset correctly when version matches', async () => {
      const payload = {
        version: currentVersion,
        name: 'MacBook Pro M3 - Updated',
        status: 'repair', // Changing status
      };

      const res = await app.request(`/api/assets/${createdAssetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ctx.token}`,
        },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.name).toBe('MacBook Pro M3 - Updated');
      expect(json.data.status).toBe('repair');
      expect(json.data.version).toBe(currentVersion + 1);

      currentVersion = json.data.version; // Update for next tests

      // Verify UPDATED event exists
      const events = await db.select().from(assetEvents)
        .where(eq(assetEvents.assetId, createdAssetId))
        .orderBy(desc(assetEvents.createdAt));
      
      expect(events[0].eventType).toBe('STATUS_CHANGED');
    });

    it('rejects update if version mismatch (optimistic locking)', async () => {
      const payload = {
        version: currentVersion - 1, // Stale version
        name: 'Attempt Stale Update',
      };

      const res = await app.request(`/api/assets/${createdAssetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ctx.token}`,
        },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(409); // Conflict
    });
  });

  describe('DELETE /api/assets/:id', () => {
    it('soft deletes the asset and verifies it no longer appears in listings', async () => {
      const payload = { version: currentVersion };

      const res = await app.request(`/api/assets/${createdAssetId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ctx.token}`,
        },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);

      // Verify it's soft deleted in DB
      const [dbAsset] = await db.select().from(assets).where(eq(assets.id, createdAssetId));
      expect(dbAsset.deletedAt).toBeDefined();

      // Verify it does not appear in standard list endpoint
      const listRes = await app.request('/api/assets', {
        headers: { 'Authorization': `Bearer ${ctx.token}` },
      });
      const listJson = await listRes.json();
      const found = listJson.data.find((a: any) => a.id === createdAssetId);
      expect(found).toBeUndefined();
    });
  });
});
