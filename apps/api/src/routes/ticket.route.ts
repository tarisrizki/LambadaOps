import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ticketService } from '../services/ticket.service.js';
import {
  createTicketSchema,
  assignTicketSchema,
  updateTicketStatusSchema,
  addTicketCommentSchema,
} from '../schemas/ticket.schema.js';
import type { AccessTokenClaims } from '../lib/auth/jwt.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireAnyRole } from '../middleware/rbac.middleware.js';
import { SystemRoles } from '../lib/auth/roles.js';

type Variables = {
  user: AccessTokenClaims;
};

export const ticketRouter = new Hono<{ Variables: Variables }>();

ticketRouter.use('*', authMiddleware);

/**
 * [GET] /tickets
 * List tickets based on role rules.
 */
ticketRouter.get('/', async (c) => {
  const user = c.get('user');
  const tickets = await ticketService.listTickets(user.userId, user.roleId);
  return c.json({ status: 'success', data: tickets });
});

/**
 * [GET] /tickets/:id
 * Get a specific ticket with comments.
 */
ticketRouter.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'), 10);
  const user = c.get('user');
  
  const ticket = await ticketService.getTicket(id, user.userId, user.roleId);
  return c.json({ status: 'success', data: ticket });
});

/**
 * [POST] /tickets
 * Create a new ticket (All authenticated users can do this).
 */
ticketRouter.post('/', zValidator('json', createTicketSchema), async (c) => {
  const user = c.get('user');
  const data = c.req.valid('json');

  const newTicket = await ticketService.createTicket({
    ...data,
    creatorId: user.userId,
    actorNameSnapshot: `User ${user.userId}`,
  });

  return c.json({ status: 'success', data: newTicket }, 201);
});

/**
 * [POST] /tickets/:id/assign
 * Assign a ticket to a technician (IT Manager / Owner only).
 */
ticketRouter.post(
  '/:id/assign',
  requireAnyRole([SystemRoles.OWNER_ADMIN, SystemRoles.IT_MANAGER]),
  zValidator('json', assignTicketSchema),
  async (c) => {
    const ticketId = parseInt(c.req.param('id'), 10);
    const user = c.get('user');
    const data = c.req.valid('json');

    const updatedTicket = await ticketService.assignTicket({
      ticketId,
      assignedToId: data.assignedToId,
      version: data.version,
      actorUserId: user.userId,
      actorNameSnapshot: `User ${user.userId}`,
    });

    return c.json({ status: 'success', data: updatedTicket });
  }
);

/**
 * [POST] /tickets/:id/status
 * Update ticket status (progressing the workflow).
 */
ticketRouter.post('/:id/status', zValidator('json', updateTicketStatusSchema), async (c) => {
  const ticketId = parseInt(c.req.param('id'), 10);
  const user = c.get('user');
  const data = c.req.valid('json');

  const updatedTicket = await ticketService.updateTicketStatus({
    ticketId,
    status: data.status,
    version: data.version,
    comment: data.comment,
    actorUserId: user.userId,
    actorNameSnapshot: `User ${user.userId}`,
    actorRoleId: user.roleId,
  });

  return c.json({ status: 'success', data: updatedTicket });
});

/**
 * [POST] /tickets/:id/comments
 * Add a comment to a ticket.
 */
ticketRouter.post('/:id/comments', zValidator('json', addTicketCommentSchema), async (c) => {
  const ticketId = parseInt(c.req.param('id'), 10);
  const user = c.get('user');
  const data = c.req.valid('json');

  // Verify access first
  await ticketService.getTicket(ticketId, user.userId, user.roleId);

  const comment = await ticketService.addComment({
    ticketId,
    content: data.content,
    authorId: user.userId,
  });

  return c.json({ status: 'success', data: comment }, 201);
});
