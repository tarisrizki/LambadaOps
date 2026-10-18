import { SettingsClient } from '@/features/settings/components/settings-client';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings | LambadaOps',
  description: 'Manage workspace reference data',
};

export default function SettingsPage() {
  return <SettingsClient />;
}
