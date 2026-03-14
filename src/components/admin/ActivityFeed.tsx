'use client';

import type { AuditLog } from '@/types';

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ActivityFeed({ logs }: { logs: AuditLog[] }) {
  if (logs.length === 0) {
    return <p className="text-muted-foreground text-center py-8">No recent activity</p>;
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-3 text-sm">
          <div className="w-2 h-2 mt-1.5 rounded-full bg-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-foreground truncate">{log.action}</p>
            <p className="text-xs text-muted-foreground">{timeAgo(log.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
