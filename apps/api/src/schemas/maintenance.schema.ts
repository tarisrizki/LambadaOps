import { z } from 'zod';

export const scheduleMaintenanceSchema = z.object({
  assetId: z.number().int().positive(),
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  scheduledDate: z.string().datetime().optional(),
  technicianId: z.number().int().positive().optional(),
});

export const maintenanceActionSchema = z.object({
  version: z.number().int().nonnegative(),
  note: z.string().max(1000).optional(),
});

export const completeMaintenanceSchema = maintenanceActionSchema.extend({
  laborCost: z.number().nonnegative().optional(),
  vendorCost: z.number().nonnegative().optional(),
  taxAmount: z.number().nonnegative().optional(),
  discountAmount: z.number().nonnegative().optional(),
});

export const addPartSchema = z.object({
  partName: z.string().min(1).max(255),
  partNumber: z.string().max(255).optional(),
  quantity: z.number().int().positive(),
  unitCost: z.number().nonnegative(),
});

export const addNoteSchema = z.object({
  note: z.string().min(1).max(2000),
});
