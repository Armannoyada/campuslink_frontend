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
    return <p className="text-muted-foreground">User not found</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft size={18} className="mr-1" /> Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{user.username}</h1>
        {!user.isActive && <Badge variant="destructive">Banned</Badge>}
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl text-foreground">{user.username}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              {user.phone && <p className="text-muted-foreground text-sm">{user.phone}</p>}
              <div className="flex gap-2 mt-2">
                {user.roles.map((role) => (
                  <Badge key={role.id} className="bg-primary/10 text-primary">
                    <Shield size={12} className="mr-1" />
                    {role.displayName}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
              <p>Last Login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}</p>
              <p>Active Sessions: {user.activeSessionCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="sessions">
        <TabsList>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Sessions</CardTitle>
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
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No active sessions
                      </TableCell>
                    </TableRow>
                  ) : (
                    sessions?.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="text-foreground">
                          <div className="flex items-center gap-2">
                            <Monitor size={14} className="text-muted-foreground" />
                            {session.userAgent?.substring(0, 50) || 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{session.ipAddress || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(session.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground">{new Date(session.expiresAt).toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {user.roles.map((role) => (
                  <div key={role.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                    <div>
                      <p className="text-foreground font-medium">{role.displayName}</p>
                      <p className="text-xs text-muted-foreground">{role.description || role.name}</p>
                    </div>
                    {role.isSystem && (
                      <Badge variant="outline">System</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLogs?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No audit logs</p>
                ) : (
                  auditLogs?.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-md bg-muted/50">
                      <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{log.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">
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
