'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle, X, Trash2, AlertCircle, Ban, CheckCircle,
  FileText, Image, Video, MessageSquare, User,
} from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import type { ContentReport } from '@/types';
import { toast } from 'sonner';

const contentTypeIcons: Record<string, React.ReactNode> = {
  post: <FileText size={16} />,
  reel: <Video size={16} />,
  comment: <MessageSquare size={16} />,
  note: <FileText size={16} />,
  profile: <User size={16} />,
  image: <Image size={16} />,
};

const severityColors: Record<number, string> = {
  1: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
  2: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
  3: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
  4: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  5: 'bg-red-200 text-red-800 dark:bg-red-600/20 dark:text-red-500',
};

export default function ContentPage() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', statusFilter],
    queryFn: async () => {
      const res = await adminApi.get(`/admin/reports?status=${statusFilter}`);
      return res.data.data as { items: ContentReport[]; hasMore: boolean };
    },
  });

  const { data: reportDetail } = useQuery({
    queryKey: ['admin-report', selectedId],
    queryFn: async () => {
      const res = await adminApi.get(`/admin/reports/${selectedId}`);
      return res.data.data as ContentReport;
    },
    enabled: !!selectedId,
  });

  const actionMutation = useMutation({
    mutationFn: async ({ action, note }: { action: string; note: string }) => {
      await adminApi.post(`/admin/reports/${selectedId}/action`, { action, note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      setActionNote('');
      const currentIndex = data?.items.findIndex((r) => r.id === selectedId) ?? -1;
      const next = data?.items[currentIndex + 1];
      setSelectedId(next?.id || null);
      toast.success('Action taken');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Content Moderation</h1>
        <div className="flex gap-2">
          {['pending', 'reviewed', 'dismissed'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setStatusFilter(status); setSelectedId(null); }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
          ) : data?.items.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <CheckCircle size={48} className="text-green-500 dark:text-green-400 mb-4" />
                <p className="text-lg font-medium">Queue Empty!</p>
                <p className="text-sm">All reports have been reviewed.</p>
              </CardContent>
            </Card>
          ) : (
            data?.items.map((report) => (
              <Card
                key={report.id}
                className={`cursor-pointer transition-colors ${
                  selectedId === report.id ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedId(report.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-muted-foreground mt-0.5">
                      {contentTypeIcons[report.contentType] || <FileText size={16} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-xs ${severityColors[report.severity] || severityColors[1]}`}>
                          Sev {report.severity}
                        </Badge>
                        <span className="text-xs text-muted-foreground capitalize">{report.contentType}</span>
                      </div>
                      <p className="text-sm text-foreground mt-1 capitalize">{report.reason}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(report.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedId && reportDetail ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Review Report</CardTitle>
                  <Badge className={severityColors[reportDetail.severity] || severityColors[1]}>
                    Severity {reportDetail.severity}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Content Type</p>
                    <p className="text-foreground capitalize">{reportDetail.contentType}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Reason</p>
                    <p className="text-foreground capitalize">{reportDetail.reason}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Reporter</p>
                    <p className="text-foreground">{reportDetail.reporter?.username || reportDetail.reporterId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Reported At</p>
                    <p className="text-foreground">{new Date(reportDetail.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {reportDetail.description && (
                  <div>
                    <p className="text-muted-foreground text-sm">Description</p>
                    <p className="text-foreground text-sm mt-1 p-3 bg-muted/50 rounded-md">
                      {reportDetail.description}
                    </p>
                  </div>
                )}

                <Separator />

                <div>
                  <p className="text-foreground text-sm mb-2">Action Note</p>
                  <Input
                    placeholder="Add a note about your decision..."
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!actionNote || actionMutation.isPending}
                    onClick={() => actionMutation.mutate({ action: 'dismiss', note: actionNote })}
                  >
                    <X size={14} className="mr-1" /> Dismiss
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!actionNote || actionMutation.isPending}
                    onClick={() => actionMutation.mutate({ action: 'remove_content', note: actionNote })}
                    className="border-orange-300 text-orange-600 dark:border-orange-500/30 dark:text-orange-400"
                  >
                    <Trash2 size={14} className="mr-1" /> Remove
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!actionNote || actionMutation.isPending}
                    onClick={() => actionMutation.mutate({ action: 'warn_user', note: actionNote })}
                    className="border-yellow-300 text-yellow-600 dark:border-yellow-500/30 dark:text-yellow-400"
                  >
                    <AlertCircle size={14} className="mr-1" /> Warn
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={!actionNote || actionMutation.isPending}
                    onClick={() => actionMutation.mutate({ action: 'ban_user', note: actionNote })}
                  >
                    <Ban size={14} className="mr-1" /> Ban
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                Select a report from the queue to review
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
