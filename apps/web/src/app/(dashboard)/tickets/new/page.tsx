import { TicketForm } from '@/features/tickets/components/ticket-form';

export default async function NewTicketPage({ searchParams }: { searchParams: Promise<{ assetId?: string }> }) {
  const params = await searchParams;
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight">New Ticket</h2>
      </div>
      <TicketForm initialAssetId={params.assetId ? Number(params.assetId) : undefined} />
    </div>
  );
}
