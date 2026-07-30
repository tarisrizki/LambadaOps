import { describe, it, expect, beforeAll } from 'vitest';
import app from '../../src/index.js';
import { createTestTenant } from '../setup.integration.js';
import { db } from '../../src/db/index.js';
import { tickets, ticketComments } from '../../src/db/schema/ticket.schema.js';
import { auditLogs } from '../../src/db/schema/audit.schema.js';
import { eq, desc } from 'drizzle-orm';
import { users } from '../../src/db/schema/user.schema.js';
import { SystemRoles } from '../../src/lib/auth/roles.js';
import crypto from 'node:crypto';

describe('Ticket Domain Integration Tests', () => {
  let ctx: Awaited<ReturnType<typeof createTestTenant>>;
  let ticketId: number;
  let ticketVersion: number;
  let technicianId: number;

  beforeAll(async () => {
    ctx = await createTestTenant();

    // Create a technician user for assignment
    const [tech] = await db.insert(users).values({
      tenantId: ctx.tenant.id,
      email: `tech-${crypto.randomUUID()}@example.com`,
      password: 'hashed',
      name: 'Tech User',
      roleId: SystemRoles.TECHNICIAN,
    }).returning();
    technicianId = tech.id;
  });

  describe('POST /api/tickets', () => {
    it('creates a new ticket', async () => {
      const payload = {
        title: 'Printer Broken',
        description: 'The office printer is jammed.',
        category: 'Hardware',
        priority: 'high',
      };

      const res = await app.request('/api/tickets', {
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
      expect(json.data.title).toBe('Printer Broken');
      expect(json.data.status).toBe('open');
      
      ticketId = json.data.id;
      ticketVersion = json.data.version;

      // Verify audit log
      const logs = await db.select().from(auditLogs)
        .where(eq(auditLogs.entityId, ticketId.toString()))
        .orderBy(desc(auditLogs.createdAt));
      
      expect(logs[0].action).toBe('CREATE');
    });
  });

  describe('GET /api/tickets', () => {
    it('lists tickets for the user', async () => {
      const res = await app.request(`/api/tickets`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ctx.token}`,
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThan(0);
      expect(json.data[0].id).toBe(ticketId);
    });
  });

  describe('POST /api/tickets/:id/assign', () => {
    it('assigns the ticket to a technician', async () => {
      const payload = {
        assignedToId: technicianId,
        version: ticketVersion,
      };

      const res = await app.request(`/api/tickets/${ticketId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ctx.token}`,
        },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('assigned');
      expect(json.data.assignedToId).toBe(technicianId);
      
      ticketVersion = json.data.version;
    });
  });

  describe('POST /api/tickets/:id/status', () => {
    it('updates ticket status to in_progress', async () => {
      const payload = {
        status: 'in_progress',
        version: ticketVersion,
        comment: 'I am on my way to fix it.',
      };

      const res = await app.request(`/api/tickets/${ticketId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ctx.token}`,
        },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.status).toBe('in_progress');
      
      ticketVersion = json.data.version;

      // Verify comment was added
      const comments = await db.select().from(ticketComments)
        .where(eq(ticketComments.ticketId, ticketId));
      expect(comments.length).toBe(1);
      expect(comments[0].content).toBe('I am on my way to fix it.');
    });
  });

  describe('POST /api/tickets/:id/comments', () => {
    it('adds a standalone comment', async () => {
      const payload = {
        content: 'Almost done.',
      };

      const res = await app.request(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ctx.token}`,
        },
        body: JSON.stringify(payload),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data.content).toBe('Almost done.');
    });
  });

  describe('GET /api/tickets/:id', () => {
    it('retrieves the ticket with comments', async () => {
      const res = await app.request(`/api/tickets/${ticketId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${ctx.token}`,
        },
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.id).toBe(ticketId);
      expect(json.data.comments.length).toBe(2);
    });
  });
});
