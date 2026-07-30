import { z } from 'zod';

export const scheduleMaintenanceSchema = z.object({
  assetId: z.coerce.number().int().positive({ message: 'Asset is required' }),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(1000).optional(),
  scheduledDate: z.string().optional(),
  technicianId: z.coerce.number().int().positive().optional(),
});

export type ScheduleMaintenanceInput = z.infer<typeof scheduleMaintenanceSchema>;

export const maintenanceActionSchema = z.object({
  version: z.number().int().nonnegative(),
  note: z.string().max(1000).optional(),
});

export type MaintenanceActionInput = z.infer<typeof maintenanceActionSchema>;
