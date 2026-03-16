'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FileWarning, MessageSquare, CheckCircle, Clock } from 'lucide-react';
import { opsApi } from '@/lib/ops-api';

interface OpsStats {
  pendingReports: number;
  openTickets: number;
  resolvedToday: number;
  avgResponseTime: string;
}

export default function OpsDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['ops-stats'],
    queryFn: async () => {
      const res = await opsApi.get('/ops/stats');
      return res.data.data as OpsStats;
    },
    refetchInterval: 30000,
  });

  const cards = [
    { label: 'Pending Reports', value: stats?.pendingReports ?? 0, icon: FileWarning, bg: 'bg-orange-50 dark:bg-orange-950/40', color: 'text-orange-600 dark:text-orange-400' },
    { label: 'Open Tickets', value: stats?.openTickets ?? 0, icon: MessageSquare, bg: 'bg-blue-50 dark:bg-blue-950/40', color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Resolved Today', value: stats?.resolvedToday ?? 0, icon: CheckCircle, bg: 'bg-green-50 dark:bg-green-950/40', color: 'text-green-600 dark:text-green-400' },
    { label: 'Avg Response', value: stats?.avgResponseTime ?? '--', icon: Clock, bg: 'bg-purple-50 dark:bg-purple-950/40', color: 'text-purple-600 dark:text-purple-400' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Operations Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-6">
              {isLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${card.bg}`}>
                    <card.icon className={card.color} size={24} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-12">
              Content moderation queue will appear here.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-12">
              Support tickets will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
