'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { UserGrowthItem } from '@/types';

export function UserGrowthChart({ data }: { data: UserGrowthItem[] }) {
  if (data.length === 0) {
    return <p className="text-slate-500 text-center py-16">No data available</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#94A3B8', fontSize: 12 }}
          tickFormatter={(val) => new Date(val).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        />
        <YAxis tick={{ fill: '#94A3B8', fontSize: 12 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '8px', color: '#E2E8F0' }}
        />
        <Line type="monotone" dataKey="newSignups" stroke="#1A73E8" strokeWidth={2} dot={false} name="New Signups" />
        <Line type="monotone" dataKey="cumulative" stroke="#10B981" strokeWidth={2} dot={false} name="Cumulative" />
      </LineChart>
    </ResponsiveContainer>
  );
}
