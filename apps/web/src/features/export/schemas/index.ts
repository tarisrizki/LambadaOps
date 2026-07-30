export type ExportJob = {
  id: number;
  tenantId: number;
  requestedById: number;
  entityType: 'assets' | 'tickets';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  fileUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
};
