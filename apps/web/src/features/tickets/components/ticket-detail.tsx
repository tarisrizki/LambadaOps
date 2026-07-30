import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TicketStatusBadge } from './ticket-status-badge';
import { TicketPriorityBadge } from './ticket-priority-badge';

type Ticket = {
  id: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assetId?: number | null;
  creatorName?: string;
  assigneeName?: string;
  createdAt: string;
  resolvedAt?: string | null;
};

export function TicketDetail({ ticket }: { ticket: Ticket }) {
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
        <div className="space-y-1">
          <CardTitle className="text-2xl font-bold">{ticket.title}</CardTitle>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>#{ticket.id}</span>
            <span>•</span>
            <span>Created by {ticket.creatorName || 'Unknown'} on {new Date(ticket.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <TicketPriorityBadge priority={ticket.priority} />
          <TicketStatusBadge status={ticket.status} />
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wider">Description</h3>
              <p className="text-base whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-1 text-sm text-muted-foreground uppercase tracking-wider">Details</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between border-b pb-1">
                  <dt className="text-muted-foreground">Category:</dt>
                  <dd className="font-medium capitalize">{ticket.category}</dd>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <dt className="text-muted-foreground">Assignee:</dt>
                  <dd className="font-medium">{ticket.assigneeName || 'Unassigned'}</dd>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <dt className="text-muted-foreground">Related Asset:</dt>
                  <dd className="font-medium">{ticket.assetId ? `#${ticket.assetId}` : 'None'}</dd>
                </div>
                {ticket.resolvedAt && (
                  <div className="flex justify-between border-b pb-1">
                    <dt className="text-muted-foreground">Resolved On:</dt>
                    <dd className="font-medium">{new Date(ticket.resolvedAt).toLocaleDateString()}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
