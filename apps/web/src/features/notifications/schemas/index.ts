export type Notification = {
  id: number;
  tenantId: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};
