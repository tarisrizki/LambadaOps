import { z } from 'zod';

export const assignAssetSchema = z.object({
  version: z.coerce.number().int().nonnegative('Version is required'),
  assignmentType: z.enum(['individual', 'shared', 'unassigned']),
  userId: z.coerce.number().positive().optional().nullable(),
  departmentId: z.coerce.number().positive().optional().nullable(),
  note: z.string().optional(),
}).refine(data => {
  if (data.assignmentType === 'individual' && !data.userId) return false;
  if (data.assignmentType === 'shared' && !data.departmentId) return false;
  return true;
}, {
  message: 'Invalid assignment targets: individual requires user, shared requires department',
  path: ['assignmentType'],
});

export const transferAssetSchema = z.object({
  version: z.coerce.number().int().nonnegative('Version is required'),
  assignmentType: z.enum(['individual', 'shared', 'unassigned']),
  userId: z.coerce.number().positive().optional().nullable(),
  departmentId: z.coerce.number().positive().optional().nullable(),
  note: z.string().optional(),
}).refine(data => {
  if (data.assignmentType === 'individual' && !data.userId) return false;
  if (data.assignmentType === 'shared' && !data.departmentId) return false;
  return true;
}, {
  message: 'Invalid transfer targets: individual requires user, shared requires department',
  path: ['assignmentType'],
});

export const returnAssetSchema = z.object({
  version: z.coerce.number().int().nonnegative('Version is required'),
  note: z.string().optional(),
});

export type AssignAssetInput = z.infer<typeof assignAssetSchema>;
export type TransferAssetInput = z.infer<typeof transferAssetSchema>;
export type ReturnAssetInput = z.infer<typeof returnAssetSchema>;
