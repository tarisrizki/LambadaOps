import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, AlertCircle, Play, Pause, XCircle } from 'lucide-react';

type MaintenanceStatus = 'scheduled' | 'ready' | 'in_progress' | 'paused' | 'completed' | 'cancelled';

const statusConfig: Record<MaintenanceStatus, { label: string; className: string; icon: React.ElementType }> = {
  scheduled: {
    label: 'Scheduled',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200',
    icon: Clock,
  },
  ready: {
    label: 'Ready',
    className: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-indigo-200',
    icon: CheckCircle2,
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200',
    icon: Play,
  },
  paused: {
    label: 'Paused',
    className: 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200',
    icon: Pause,
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200',
    icon: XCircle,
  },
};

interface MaintenanceStatusBadgeProps {
  status: string;
  className?: string;
}

export function MaintenanceStatusBadge({ status, className }: MaintenanceStatusBadgeProps) {
  const config = statusConfig[status as MaintenanceStatus] || {
    label: status,
    className: 'bg-gray-100 text-gray-800',
    icon: AlertCircle,
  };

  const Icon = config.icon;

  return (
    <Badge className={`flex items-center gap-1 font-medium ${config.className} ${className}`} variant="outline">
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </Badge>
  );
}
