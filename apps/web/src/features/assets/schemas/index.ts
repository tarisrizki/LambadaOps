import { z } from 'zod';

export const assetStatusEnum = z.enum(['active', 'repair', 'lost', 'retired', 'disposed']);
export const assetConditionEnum = z.enum(['good', 'fair', 'poor']);

export const createAssetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  status: assetStatusEnum.default('active'),
  condition: assetConditionEnum.default('good'),
  categoryId: z.number().positive(),
  locationId: z.number().positive(),
  departmentId: z.number().positive(),
  purchaseDate: z.string().datetime().optional().or(z.literal('')),
  purchasePrice: z.string().optional().or(z.literal('')),
  serialNumber: z.string().max(255).optional().or(z.literal('')),
  brand: z.string().max(100).optional().or(z.literal('')),
  warrantyExpiry: z.string().datetime().optional().or(z.literal('')),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;

export const updateAssetSchema = z.object({
  version: z.number().int().nonnegative(),
  name: z.string().min(1, 'Name is required').max(255).optional(),
  status: assetStatusEnum.optional(),
  condition: assetConditionEnum.optional(),
  categoryId: z.number().positive().optional(),
  locationId: z.number().positive().optional(),
  departmentId: z.number().positive().optional(),
  purchaseDate: z.string().datetime().optional().or(z.literal('')),
  purchasePrice: z.string().optional().or(z.literal('')),
  serialNumber: z.string().max(255).optional().or(z.literal('')),
  brand: z.string().max(100).optional().or(z.literal('')),
  warrantyExpiry: z.string().datetime().optional().or(z.literal('')),
});

export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
