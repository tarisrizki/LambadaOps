import { z } from 'zod';

export const createTicketSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(2000),
  category: z.string().min(1).max(100),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assetId: z.number().int().positive().optional(),
});

export const assignTicketSchema = z.object({
  assignedToId: z.number().int().positive(),
  version: z.number().int().nonnegative(),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(['open', 'assigned', 'in_progress', 'resolved', 'closed']),
  version: z.number().int().nonnegative(),
  comment: z.string().max(2000).optional(),
});

export const addTicketCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});
