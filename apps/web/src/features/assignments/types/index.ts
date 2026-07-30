import { type AssignAssetInput, type TransferAssetInput, type ReturnAssetInput } from '../schemas';

export type AssignmentType = 'individual' | 'shared' | 'unassigned';

export interface Assignment {
  id: number;
  tenantId: number;
  assetId: number;
  assignmentType: AssignmentType;
  userId: number | null;
  departmentId: number | null;
  assignedAt: string;
  returnedAt: string | null;
  createdBy: number;
}

export interface AssignmentDetail {
  assignment: Assignment;
  asset: {
    id: number;
    name: string;
    assetCode: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
  department: {
    id: number;
    name: string;
  } | null;
  createdBy: {
    id: number;
    name: string;
  };
}

export { type AssignAssetInput, type TransferAssetInput, type ReturnAssetInput };
