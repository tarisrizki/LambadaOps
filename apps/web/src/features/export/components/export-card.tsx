'use client';

import { FileText, Ticket } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTriggerExport } from '../api/mutations';

export function ExportCard() {
  const triggerMutation = useTriggerExport();

  const handleExport = (entityType: 'assets' | 'tickets') => {
    triggerMutation.mutate(entityType);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Data</CardTitle>
        <CardDescription>Generate and download CSV reports of your workspace data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">Assets Inventory</h4>
              <p className="text-sm text-muted-foreground">Export all active, retired, and damaged assets.</p>
            </div>
          </div>
          <Button 
            onClick={() => handleExport('assets')}
            disabled={triggerMutation.isPending}
          >
            Generate CSV
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Ticket className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">Support Tickets</h4>
              <p className="text-sm text-muted-foreground">Export historical ticketing and maintenance logs.</p>
            </div>
          </div>
          <Button 
            onClick={() => handleExport('tickets')}
            disabled={triggerMutation.isPending}
            variant="secondary"
          >
            Generate CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
