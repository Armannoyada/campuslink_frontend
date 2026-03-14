'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { UserGrowthItem } from '@/types';

export function UserGrowthChart({ data }: { data: UserGrowthItem[] }) {
  if (data.length === 0) {
    return <p className="text-muted-foreground text-center py-16">No data available</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        />
        <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
        <Tooltip
          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }}
        />
        <Line type="monotone" dataKey="newSignups" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="New Signups" />
        <Line type="monotone" dataKey="cumulative" stroke="#10B981" strokeWidth={2} dot={false} name="Cumulative" />
      </LineChart>
    </ResponsiveContainer>
  );
}
