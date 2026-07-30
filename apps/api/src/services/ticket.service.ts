import { ticketRepository } from '../repositories/ticket.repository.js';
import { activityService } from './activity.service.js';
import { NotFoundError, ConflictError, ForbiddenError } from '../lib/errors.js';
import { SystemRoles } from '../lib/auth/roles.js';
import { TenantContext } from '../lib/tenant-context.js';
import { notificationService } from './notification.service.js';
import crypto from 'node:crypto';

export interface CreateTicketParams {
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assetId?: number;
  creatorId: number;
  actorNameSnapshot: string;
}

export interface AssignTicketParams {
  ticketId: number;
  assignedToId: number;
  version: number;
  actorUserId: number;
  actorNameSnapshot: string;
}

export interface UpdateTicketStatusParams {
  ticketId: number;
  status: 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';
  version: number;
  comment?: string;
  actorUserId: number;
  actorNameSnapshot: string;
  actorRoleId?: number;
}

export interface AddTicketCommentParams {
  ticketId: number;
  content: string;
  authorId: number;
}

export class TicketService {
  async createTicket(params: CreateTicketParams) {
    return await ticketRepository.transaction(async (txRepo) => {
      const ticket = await txRepo.createTicket({
        title: params.title,
        description: params.description,
        category: params.category,
        priority: params.priority,
        assetId: params.assetId || null,
        creatorId: params.creatorId,
        status: 'open',
      });

      const correlationId = crypto.randomUUID();

      await activityService.logAudit({
        entityType: 'ticket',
        entityId: ticket.id.toString(),
        action: 'CREATE',
        oldValue: null,
        newValue: ticket,
        actorId: params.creatorId,
        correlationId,
      }, txRepo.txSession);

      return ticket;
    });
  }

  async assignTicket(params: AssignTicketParams) {
    const ticket = await ticketRepository.findTicketById(params.ticketId);
    if (!ticket) throw new NotFoundError('Ticket');

    return await ticketRepository.transaction(async (txRepo) => {
      const updatedTicket = await txRepo.updateTicketWithVersion(params.ticketId, params.version, {
        assignedToId: params.assignedToId,
        status: 'assigned',
      });
      if (!updatedTicket) throw new ConflictError('Concurrency conflict on Ticket.');

      const correlationId = crypto.randomUUID();

      await activityService.logAudit({
        entityType: 'ticket',
        entityId: ticket.id.toString(),
        action: 'ASSIGN',
        oldValue: ticket,
        newValue: updatedTicket,
        actorId: params.actorUserId,
        correlationId,
      }, txRepo.txSession);

      // Create a notification for the assigned user
      await notificationService.createNotification({
        tenantId: TenantContext.getTenantId(),
        userId: params.assignedToId,
        type: 'ticket_assigned',
        title: 'New Ticket Assigned',
        message: `Ticket #${ticket.id} "${ticket.title}" has been assigned to you.`,
        actionUrl: `/tickets/${ticket.id}`
      });

      return updatedTicket;
    });
  }

  async updateTicketStatus(params: UpdateTicketStatusParams) {
    const ticket = await ticketRepository.findTicketById(params.ticketId);
    if (!ticket) throw new NotFoundError('Ticket');

    // FLS / Role checking
    // Technician can only update assigned tickets
    if (params.actorRoleId === SystemRoles.TECHNICIAN && ticket.assignedToId !== params.actorUserId) {
      throw new ForbiddenError('Technician can only update assigned tickets');
    }

    // Employee cannot update tickets unless they want to close their own?
    // Specification: Employee cannot update status except maybe closing their own.
    // For simplicity, we enforce basic status logic.
    if (params.actorRoleId === SystemRoles.EMPLOYEE && ticket.creatorId !== params.actorUserId) {
      throw new ForbiddenError('Employee can only manage own tickets');
    }

    return await ticketRepository.transaction(async (txRepo) => {
      const updateData: Partial<{ status: typeof params.status; resolvedAt: Date }> = { status: params.status };
      if (params.status === 'resolved') {
        updateData.resolvedAt = new Date();
      }

      const updatedTicket = await txRepo.updateTicketWithVersion(params.ticketId, params.version, updateData);
      if (!updatedTicket) throw new ConflictError('Concurrency conflict on Ticket.');

      if (params.comment) {
        await txRepo.addComment({
          ticketId: params.ticketId,
          content: params.comment,
          authorId: params.actorUserId,
        });
      }

      const correlationId = crypto.randomUUID();

      await activityService.logAudit({
        entityType: 'ticket',
        entityId: ticket.id.toString(),
        action: 'UPDATE_STATUS',
        oldValue: ticket,
        newValue: updatedTicket,
        actorId: params.actorUserId,
        correlationId,
      }, txRepo.txSession);

      return updatedTicket;
    });
  }

  async addComment(params: AddTicketCommentParams) {
    const ticket = await ticketRepository.findTicketById(params.ticketId);
    if (!ticket) throw new NotFoundError('Ticket');

    return await ticketRepository.transaction(async (txRepo) => {
      const comment = await txRepo.addComment({
        ticketId: params.ticketId,
        content: params.content,
        authorId: params.authorId,
      });
      return comment;
    });
  }

  async getTicket(id: number, actorUserId: number, actorRoleId: number) {
    const ticket = await ticketRepository.findTicketById(id);
    if (!ticket) throw new NotFoundError('Ticket');

    // Apply visibility rules
    if (actorRoleId === SystemRoles.EMPLOYEE && ticket.creatorId !== actorUserId) {
      throw new ForbiddenError('Cannot view ticket you did not create');
    }
    if (actorRoleId === SystemRoles.TECHNICIAN && ticket.assignedToId !== actorUserId) {
      throw new ForbiddenError('Cannot view ticket not assigned to you');
    }

    const comments = await ticketRepository.getCommentsByTicket(id);

    return { ...ticket, comments };
  }

  async listTickets(actorUserId: number, actorRoleId: number) {
    if (actorRoleId === SystemRoles.EMPLOYEE) {
      return await ticketRepository.findTicketsByCreator(actorUserId);
    }
    if (actorRoleId === SystemRoles.TECHNICIAN) {
      return await ticketRepository.findTicketsByAssignee(actorUserId);
    }
    return await ticketRepository.findAllTickets();
  }
}

export const ticketService = new TicketService();
