import { DashboardHome } from '@/features/dashboard/components/dashboard-home';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | LambadaOps',
  description: 'Overview of your workspace',
};

export default function DashboardPage() {
  return <DashboardHome />;
}
