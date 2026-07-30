import { z } from 'zod';

export const assignAssetSchema = z.object({
  version: z.number().int().nonnegative(),
  assignmentType: z.enum(['individual', 'shared', 'unassigned']),
  userId: z.number().positive().optional().nullable(),
  departmentId: z.number().positive().optional().nullable(),
  note: z.string().optional(),
}).refine(data => {
  if (data.assignmentType === 'individual' && !data.userId) return false;
  if (data.assignmentType === 'shared' && !data.departmentId) return false;
  return true;
}, {
  message: 'Invalid assignment targets: individual requires userId, shared requires departmentId',
});

export const transferAssetSchema = z.object({
  version: z.number().int().nonnegative(),
  assignmentType: z.enum(['individual', 'shared', 'unassigned']),
  userId: z.number().positive().optional().nullable(),
  departmentId: z.number().positive().optional().nullable(),
  note: z.string().optional(),
}).refine(data => {
  if (data.assignmentType === 'individual' && !data.userId) return false;
  if (data.assignmentType === 'shared' && !data.departmentId) return false;
  return true;
}, {
  message: 'Invalid transfer targets: individual requires userId, shared requires departmentId',
});

export const returnAssetSchema = z.object({
  version: z.number().int().nonnegative(),
  note: z.string().optional(),
});

