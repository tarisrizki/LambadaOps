import { describe, it, expect, beforeAll } from 'vitest';
import app from '../../src/index.js';
import crypto from 'node:crypto';
import { createTestTenant } from '../setup.integration.js';
import { db } from '../../src/db/index.js';
import { assets, assetAssignments } from '../../src/db/schema/asset.schema.js';
import { eq } from 'drizzle-orm';

describe('Assignment Domain Integration Tests', () => {
  let ctx: Awaited<ReturnType<typeof createTestTenant>>;
  let assetId: number;
  let currentVersion: number;

  beforeAll(async () => {
    ctx = await createTestTenant();

    // Seed an asset directly for assignment tests
    const [asset] = await db.insert(assets).values({
      tenantId: ctx.tenant.id,
      name: 'Test Asset for Assignment',
      categoryId: ctx.category.id,
      locationId: ctx.location.id,
      assetCode: `TEST-${crypto.randomUUID().split('-')[0]}`,
      qrCodeToken: crypto.randomUUID(),
    }).returning();
    
    assetId = asset.id;
    currentVersion = asset.version;
  });

  describe('POST /api/assets/:id/assignments', () => {
    it('assigns asset individually to a user', async () => {
      const payload = {
        version: currentVersion,
        assignmentType: 'individual',
        userId: ctx.user.id,
        note: 'First assignment',
      };

      const res = await app.request(`/api/assets/${assetId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ctx.token}`,
        },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.status).toBe('success');
      expect(json.data.asset.currentAssignedUserId).toBe(ctx.user.id);
      expect(json.data.assignment.assignmentType).toBe('individual');
      
      currentVersion = json.data.asset.version;
    });

    it('rejects double assignment', async () => {
      const payload = {
        version: currentVersion,
        assignmentType: 'individual',
        userId: ctx.user.id,
      };

      const res = await app.request(`/api/assets/${assetId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ctx.token}`,
        },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(422); // BusinessRuleError: Asset is already assigned
    });
  });

  describe('POST /api/assets/:id/assignments/transfer', () => {
    it('transfers asset to department and returns previous assignment automatically', async () => {
      const payload = {
        version: currentVersion,
        assignmentType: 'shared',
        departmentId: ctx.department.id,
        note: 'Transferred to Engineering',
      };

      const res = await app.request(`/api/assets/${assetId}/assignments/transfer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ctx.token}`,
        },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.asset.departmentId).toBe(ctx.department.id);
      expect(json.data.asset.currentAssignedUserId).toBeNull();
      
      currentVersion = json.data.asset.version;

      // Verify the old assignment was returned
      const history = await db.select().from(assetAssignments)
        .where(eq(assetAssignments.assetId, assetId));
      
      expect(history.length).toBe(2);
      const oldAssignment = history.find(h => h.userId === ctx.user.id);
      expect(oldAssignment?.returnedAt).not.toBeNull();
    });
  });

  describe('POST /api/assets/:id/assignments/return', () => {
    it('returns the asset successfully', async () => {
      const payload = {
        version: currentVersion,
        note: 'Returned to IT',
      };

      const res = await app.request(`/api/assets/${assetId}/assignments/return`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ctx.token}`,
        },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.asset.assignmentType).toBe('unassigned');
      expect(json.data.asset.departmentId).toBeNull();
      expect(json.data.asset.currentAssignedUserId).toBeNull();
    });
  });
});
