'use client';

import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Monitor, Trash2, Shield } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Session, AuditLog, Role } from '@/types';

interface UserDetail {
  id: string;
  email: string;
  username: string;
  phone?: string;
  isVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  roles: Role[];
  recentAuditLogs: AuditLog[];
  activeSessionCount: number;
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: async () => {
      const res = await api.get(`/admin/users/${id}`);
      return res.data.data as UserDetail;
    },
  });

  const { data: sessions } = useQuery({
    queryKey: ['user-sessions', id],
    queryFn: async () => {
      const res = await api.get(`/admin/users/${id}/sessions`);
      return res.data.data as Session[];
    },
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['user-audit', id],
    queryFn: async () => {
      const res = await api.get(`/admin/users/${id}/audit-log`);
      return res.data.data as AuditLog[];
    },
  });

  const revokeSessionsMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/admin/users/${id}/sessions`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-sessions', id] });
      toast.success('All sessions revoked');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    return <p className="text-slate-400">User not found</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/users">
          <Button variant="ghost" size="sm" className="text-slate-400">
            <ArrowLeft size={18} className="mr-1" /> Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-slate-100">{user.username}</h1>
        {!user.isActive && <Badge variant="destructive">Banned</Badge>}
      </div>

      {/* Profile Card */}
      <Card className="bg-[#1E293B] border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-[#1A73E8] text-white text-xl">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl text-slate-100">{user.username}</h2>
              <p className="text-slate-400">{user.email}</p>
              {user.phone && <p className="text-slate-500 text-sm">{user.phone}</p>}
              <div className="flex gap-2 mt-2">
                {user.roles.map((role) => (
                  <Badge key={role.id} className="bg-[#1A73E8]/20 text-[#1A73E8]">
                    <Shield size={12} className="mr-1" />
                    {role.displayName}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="text-right text-sm text-slate-400">
              <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
              <p>Last Login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</p>
              <p>Active Sessions: {user.activeSessionCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="sessions">
        <TabsList className="bg-[#1E293B] border border-slate-700">
          <TabsTrigger value="sessions" className="data-[state=active]:bg-[#1A73E8] data-[state=active]:text-white">Sessions</TabsTrigger>
          <TabsTrigger value="roles" className="data-[state=active]:bg-[#1A73E8] data-[state=active]:text-white">Roles</TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-[#1A73E8] data-[state=active]:text-white">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="mt-4">
          <Card className="bg-[#1E293B] border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-slate-100">Active Sessions</CardTitle>
              {hasPermission('users:ban') && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => revokeSessionsMutation.mutate()}
                  disabled={revokeSessionsMutation.isPending}
                >
                  Revoke All
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-400">Device</TableHead>
                    <TableHead className="text-slate-400">IP Address</TableHead>
                    <TableHead className="text-slate-400">Created</TableHead>
                    <TableHead className="text-slate-400">Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions?.length === 0 ? (
                    <TableRow className="border-slate-700">
                      <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                        No active sessions
                      </TableCell>
                    </TableRow>
                  ) : (
                    sessions?.map((session) => (
                      <TableRow key={session.id} className="border-slate-700">
                        <TableCell className="text-slate-300">
                          <div className="flex items-center gap-2">
                            <Monitor size={14} className="text-slate-500" />
                            {session.userAgent?.substring(0, 50) || 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-400">{session.ipAddress || '-'}</TableCell>
                        <TableCell className="text-slate-400">{new Date(session.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="text-slate-400">{new Date(session.expiresAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <Card className="bg-[#1E293B] border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Assigned Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {user.roles.map((role) => (
                  <div key={role.id} className="flex items-center justify-between p-3 rounded-md bg-slate-800/50">
                    <div>
                      <p className="text-slate-200 font-medium">{role.displayName}</p>
                      <p className="text-xs text-slate-500">{role.description || role.name}</p>
                    </div>
                    {role.isSystem && (
                      <Badge variant="outline" className="border-slate-600 text-slate-400">System</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card className="bg-[#1E293B] border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Audit Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLogs?.length === 0 ? (
                  <p className="text-slate-500 text-center py-8">No audit logs</p>
                ) : (
                  auditLogs?.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-md bg-slate-800/50">
                      <div className="w-2 h-2 mt-2 rounded-full bg-[#1A73E8] shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-slate-300">{log.action}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(log.createdAt).toLocaleString()} • {log.ipAddress || 'System'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
