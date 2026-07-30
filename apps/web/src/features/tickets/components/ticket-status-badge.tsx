import { Badge } from '@/components/ui/badge';

type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';

export function TicketStatusBadge({ status }: { status: TicketStatus | string }) {
  const formatStatus = (s: string) => {
    return s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  switch (status) {
    case 'open':
      return <Badge variant="destructive">{formatStatus(status)}</Badge>;
    case 'assigned':
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{formatStatus(status)}</Badge>;
    case 'in_progress':
      return <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">{formatStatus(status)}</Badge>;
    case 'resolved':
      return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">{formatStatus(status)}</Badge>;
    case 'closed':
      return <Badge variant="outline" className="text-gray-500">{formatStatus(status)}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
