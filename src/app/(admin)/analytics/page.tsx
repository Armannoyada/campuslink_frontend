'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Activity,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import api from '@/lib/api';
import type { PlatformStats, UserGrowthItem, RetentionSnapshot } from '@/types';
import { UserGrowthChart } from '@/components/admin/UserGrowthChart';

const timePeriods = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
];

function formatNumber(n: number) {
  return new Intl.NumberFormat('en-IN').format(n);
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState(30);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics', 'stats'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/stats');
      return res.data.data as PlatformStats;
    },
  });

  const { data: growth, isLoading: growthLoading } = useQuery({
    queryKey: ['analytics', 'growth', period],
    queryFn: async () => {
      const res = await api.get(`/admin/analytics/user-growth?days=${period}`);
      return res.data.data as UserGrowthItem[];
    },
  });

  const { data: retention, isLoading: retentionLoading } = useQuery({
    queryKey: ['analytics', 'retention'],
    queryFn: async () => {
      const res = await api.get('/admin/analytics/retention');
      return res.data.data as RetentionSnapshot;
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Analytics</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
        ) : stats ? (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 dark:bg-blue-500/20 rounded-lg"><Users size={20} className="text-blue-600 dark:text-blue-400" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold text-foreground">{formatNumber(stats.totalUsers)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 dark:bg-green-500/20 rounded-lg"><Activity size={20} className="text-green-600 dark:text-green-400" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Today</p>
                    <p className="text-2xl font-bold text-foreground">{formatNumber(stats.activeToday)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 dark:bg-purple-500/20 rounded-lg"><TrendingUp size={20} className="text-purple-600 dark:text-purple-400" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">New This Week</p>
                    <p className="text-2xl font-bold text-foreground">{formatNumber(stats.newThisWeek)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-50 dark:bg-red-500/20 rounded-lg"><Calendar size={20} className="text-red-600 dark:text-red-400" /></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reports Pending</p>
                    <p className="text-2xl font-bold text-foreground">{formatNumber(stats.pendingReports)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>

      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>User Growth</CardTitle>
            <div className="flex gap-1">
              {timePeriods.map((tp) => (
                <Button
                  key={tp.value}
                  size="sm"
                  variant={period === tp.value ? 'default' : 'outline'}
                  onClick={() => setPeriod(tp.value)}
                >
                  {tp.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {growthLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : growth ? (
            <UserGrowthChart data={growth} />
          ) : (
            <p className="text-muted-foreground text-center py-12">No data available</p>
          )}
        </CardContent>
      </Card>

      {/* Retention Snapshot */}
      <Card>
        <CardHeader>
          <CardTitle>Retention Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          {retentionLoading ? (
            <div className="grid grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : retention ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">DAU</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{formatNumber(retention.dau)}</p>
                <p className="text-xs text-muted-foreground mt-1">Daily Active Users</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">WAU</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatNumber(retention.wau)}</p>
                <p className="text-xs text-muted-foreground mt-1">Weekly Active Users</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">MAU</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{formatNumber(retention.mau)}</p>
                <p className="text-xs text-muted-foreground mt-1">Monthly Active Users</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No retention data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
