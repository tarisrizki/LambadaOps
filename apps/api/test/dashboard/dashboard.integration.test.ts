import { describe, it, expect, beforeAll } from 'vitest';
import app from '../../src/index.js';
import { createTestTenant } from '../setup.integration.js';
import { db } from '../../src/db/index.js';
import { assets, assetEvents } from '../../src/db/schema/asset.schema.js';
import { tickets } from '../../src/db/schema/ticket.schema.js';

describe('Dashboard Integration Tests', () => {
  let ctx: Awaited<ReturnType<typeof createTestTenant>>;
  let createdAssetId: number;

  beforeAll(async () => {
    ctx = await createTestTenant();

    const randomSuffix = Math.random().toString(36).substring(7);

    // Setup some data for the dashboard to read
    const [dbAsset] = await db.insert(assets).values({
      tenantId: ctx.tenant.id,
      assetCode: `DASH-001-${randomSuffix}`,
      name: 'Dashboard Test Asset',
      categoryId: ctx.category.id,
      locationId: ctx.location.id,
      departmentId: ctx.department.id,
      purchasePrice: '1000.00',
      status: 'active',
      condition: 'good',
      qrCodeToken: `dash-token-001-${randomSuffix}`,
      assignmentType: 'unassigned'
    }).returning();
    createdAssetId = dbAsset.id;

    // Create a broken asset
    await db.insert(assets).values({
      tenantId: ctx.tenant.id,
      assetCode: `DASH-002-${randomSuffix}`,
      name: 'Broken Asset',
      categoryId: ctx.category.id,
      locationId: ctx.location.id,
      status: 'repair',
      condition: 'poor',
      qrCodeToken: `dash-token-002-${randomSuffix}`
    });

    // Create an active ticket
    await db.insert(tickets).values({
      tenantId: ctx.tenant.id,
      assetId: createdAssetId,
      title: 'Fix screen',
      description: 'Screen is flickering',
      priority: 'high',
      status: 'open',
      category: 'hardware',
      creatorId: ctx.user.id
    });

    // Create a recent activity (ASSIGNED)
    await db.insert(assetEvents).values({
      tenantId: ctx.tenant.id,
      assetId: createdAssetId,
      eventType: 'ASSIGNED',
      category: 'ASSIGNMENT',
      severity: 'INFO',
      actorUserId: ctx.user.id,
      actorNameSnapshot: ctx.user.name,
      note: 'Assigned to John'
    });
  });

  describe('GET /api/dashboard/summary', () => {
    it('returns the correct dashboard metrics', async () => {
      const res = await app.request('/api/dashboard/summary', {
        headers: { 'Authorization': `Bearer ${ctx.token}` },
      });

      expect(res.status).toBe(200);
      const json = await res.json() as any;
      expect(json.status).toBe('success');
      
      const { data } = json;
      expect(data.totalAssets).toBeGreaterThanOrEqual(2);
      expect(data.assetsInRepair).toBeGreaterThanOrEqual(1);
      expect(data.activeTickets).toBeGreaterThanOrEqual(1); // This is the new field we need
      
      // Ensure recent activity only has assignment events
      expect(data.recentActivity).toBeDefined();
      expect(data.recentActivity.length).toBeGreaterThanOrEqual(1);
      for (const event of data.recentActivity) {
        expect(['ASSIGNED', 'RETURNED', 'TRANSFERRED']).toContain(event.eventType);
      }
    });
  });
});
