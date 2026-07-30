import { z } from 'zod';

export const createAssetSchema = z.object({
  name: z.string().min(1).max(255),
  status: z.enum(['active', 'repair', 'lost', 'retired', 'disposed']).default('active'),
  condition: z.enum(['good', 'fair', 'poor']).default('good'),
  categoryId: z.number().positive(),
  locationId: z.number().positive(),
  departmentId: z.number().positive(),
  purchaseDate: z.string().datetime().optional(),
  purchasePrice: z.string().optional(),
  serialNumber: z.string().max(255).optional(),
  manufacturer: z.string().max(255).optional(),
  model: z.string().max(255).optional(),
  warrantyExpiry: z.string().datetime().optional(),
});

export const updateAssetSchema = z.object({
  version: z.number().int().nonnegative(),
  name: z.string().min(1).max(255).optional(),
  status: z.enum(['active', 'repair', 'lost', 'retired', 'disposed']).optional(),
  condition: z.enum(['good', 'fair', 'poor']).optional(),
  categoryId: z.number().positive().optional(),
  locationId: z.number().positive().optional(),
  departmentId: z.number().positive().optional(),
  purchaseDate: z.string().datetime().optional(),
  purchasePrice: z.string().optional(),
  serialNumber: z.string().max(255).optional(),
  manufacturer: z.string().max(255).optional(),
  model: z.string().max(255).optional(),
  warrantyExpiry: z.string().datetime().optional(),
});

export const softDeleteAssetSchema = z.object({
  version: z.number().int().nonnegative(),
});
