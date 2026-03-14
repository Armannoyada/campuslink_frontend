'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Activity, FileText, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import api from '@/lib/api';
import type { PlatformStats, UserGrowthItem, AuditLog } from '@/types';
import { UserGrowthChart } from '@/components/admin/UserGrowthChart';
import { ActivityFeed } from '@/components/admin/ActivityFeed';

function formatNumber(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['platform-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/stats');
      return res.data.data as PlatformStats;
    },
    refetchInterval: 60000,
  });

  const { data: growth, isLoading: growthLoading } = useQuery({
    queryKey: ['user-growth', 30],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/user-growth?days=30');
      return res.data.data as UserGrowthItem[];
    },
    refetchInterval: 60000,
  });

  const { data: activity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/activity?limit=20');
      return res.data.data as AuditLog[];
    },
    refetchInterval: 30000,
  });

  const kpiCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, bg: 'bg-blue-50 dark:bg-blue-950/40', color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Active Today', value: stats?.activeToday ?? 0, icon: Activity, bg: 'bg-green-50 dark:bg-green-950/40', color: 'text-green-600 dark:text-green-400' },
    { label: 'New This Week', value: stats?.newThisWeek ?? 0, icon: TrendingUp, bg: 'bg-purple-50 dark:bg-purple-950/40', color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Reports Pending', value: stats?.pendingReports ?? 0, icon: AlertTriangle, bg: 'bg-orange-50 dark:bg-orange-950/40', color: 'text-orange-600 dark:text-orange-400' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-6">
              {statsLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">
                      {formatNumber(card.value)}
                    </p>
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

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>User Growth (30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {growthLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <UserGrowthChart data={growth || []} />
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed logs={activity || []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
