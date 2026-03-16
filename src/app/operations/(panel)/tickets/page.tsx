'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

export default function TicketsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Support Tickets</h1>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <MessageSquare size={48} className="mb-4 text-teal-500" />
          <p className="text-lg font-medium">Support Tickets</p>
          <p className="text-sm mt-1">Ticket management system coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
