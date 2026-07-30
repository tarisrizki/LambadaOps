import { z } from 'zod';

export const importUploadSchema = z.object({
  file: z.instanceof(File, { message: 'File is required' })
    .refine((file) => file.name.endsWith('.xlsx'), 'Only .xlsx files are allowed')
});

export type ImportUploadInput = z.infer<typeof importUploadSchema>;

export type ImportJob = {
  id: number;
  tenantId: number;
  uploadedById: number;
  filePath: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number | null;
  successRows: number | null;
  failedRows: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ImportError = {
  id: number;
  importJobId: number;
  rowNumber: number;
  field: string | null;
  errorMessage: string;
  rawRowData: unknown;
  createdAt: string;
};
