import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';

type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export function TicketPriorityBadge({ priority }: { priority: TicketPriority | string }) {
  switch (priority) {
    case 'urgent':
      return (
        <Badge variant="destructive" className="flex w-fit items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Urgent
        </Badge>
      );
    case 'high':
      return (
        <Badge variant="default" className="flex w-fit items-center gap-1 bg-orange-500 hover:bg-orange-600">
          <ArrowUp className="h-3 w-3" />
          High
        </Badge>
      );
    case 'medium':
      return (
        <Badge variant="secondary" className="flex w-fit items-center gap-1">
          <ArrowRight className="h-3 w-3" />
          Medium
        </Badge>
      );
    case 'low':
      return (
        <Badge variant="outline" className="flex w-fit items-center gap-1">
          <ArrowDown className="h-3 w-3" />
          Low
        </Badge>
      );
    default:
      return <Badge variant="outline">{priority}</Badge>;
  }
}
