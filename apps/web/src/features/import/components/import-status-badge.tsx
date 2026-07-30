import { Badge } from '@/components/ui/badge';
import { Clock, Play, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import type { ImportJob } from '../schemas';

const statusConfig: Record<ImportJob['status'], { label: string; className: string; icon: React.ElementType }> = {
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200',
    icon: Clock,
  },
  processing: {
    label: 'Processing',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200 animate-pulse',
    icon: Play,
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200',
    icon: CheckCircle2,
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200',
    icon: XCircle,
  },
};

interface ImportStatusBadgeProps {
  status: ImportJob['status'];
  className?: string;
}

export function ImportStatusBadge({ status, className }: ImportStatusBadgeProps) {
  const config = statusConfig[status] || {
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
