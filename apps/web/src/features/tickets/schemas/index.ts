import { z } from 'zod';

export const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required').max(2000),
  category: z.string().min(1, 'Category is required').max(100),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assetId: z.coerce.number().int().positive().optional().or(z.literal('')),
});
export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const assignTicketSchema = z.object({
  assignedToId: z.coerce.number().int().positive(),
  version: z.number().int().nonnegative(),
});
export type AssignTicketInput = z.infer<typeof assignTicketSchema>;

export const updateTicketStatusSchema = z.object({
  status: z.enum(['open', 'assigned', 'in_progress', 'resolved', 'closed']),
  version: z.number().int().nonnegative(),
  comment: z.string().max(2000).optional().or(z.literal('')),
});
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>;

export const addTicketCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000),
});
export type AddTicketCommentInput = z.infer<typeof addTicketCommentSchema>;
