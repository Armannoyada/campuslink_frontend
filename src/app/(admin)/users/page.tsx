'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MoreHorizontal, Search, Ban, Trash2, UserCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import type { User, PaginatedResponse } from '@/types';
import { toast } from 'sonner';

export default function UsersPage() {
  const { hasPermission } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [banDialog, setBanDialog] = useState<{ open: boolean; userId: string; username: string }>({
    open: false, userId: '', username: '',
  });
  const [banReason, setBanReason] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; userId: string; username: string }>({
    open: false, userId: '', username: '',
  });
  const [confirmText, setConfirmText] = useState('');

  // Debounced search
  const handleSearch = (value: string) => {
    setSearch(value);
    const timeout = setTimeout(() => setDebouncedSearch(value), 300);
    return () => clearTimeout(timeout);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['users', debouncedSearch, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (statusFilter === 'active') params.set('isActive', 'true');
      if (statusFilter === 'banned') params.set('isActive', 'false');
      const res = await api.get(`/admin/users?${params}`);
      return res.data.data as PaginatedResponse<User>;
    },
  });

  const banMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      await api.post(`/admin/users/${userId}/ban`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setBanDialog({ open: false, userId: '', username: '' });
      setBanReason('');
      toast.success('User banned successfully');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const unbanMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.post(`/admin/users/${userId}/unban`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User unbanned');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteDialog({ open: false, userId: '', username: '' });
      setConfirmText('');
      toast.success('User deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function getStatusBadge(user: User) {
    if (user.deletedAt) return <Badge variant="destructive">Deleted</Badge>;
    if (!user.isActive) return <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">Banned</Badge>;
    return <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400">Active</Badge>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search by email or username..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['', 'active', 'banned'].map((status) => (
            <Button
              key={status}
              variant={statusFilter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(status)}
            >
              {status === '' ? 'All' : status === 'active' ? 'Active' : 'Banned'}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Roles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Last Login</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-6" /></TableCell>
                </TableRow>
              ))
            ) : data?.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                  No users found matching your filters
                </TableCell>
              </TableRow>
            ) : (
              data?.items.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/users/${user.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {user.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-foreground font-medium">{user.username}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.map((role) => (
                        <Badge key={role.id} variant="outline" className="text-xs">
                          {role.displayName}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(user)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
                      >
                        <MoreHorizontal size={16} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {hasPermission('users:ban') && user.isActive && (
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); setBanDialog({ open: true, userId: user.id, username: user.username }); }}
                            className="text-destructive"
                          >
                            <Ban size={14} className="mr-2" /> Ban User
                          </DropdownMenuItem>
                        )}
                        {hasPermission('users:ban') && !user.isActive && !user.deletedAt && (
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); unbanMutation.mutate(user.id); }}
                            className="text-green-600 dark:text-green-400"
                          >
                            <UserCheck size={14} className="mr-2" /> Unban User
                          </DropdownMenuItem>
                        )}
                        {hasPermission('users:delete') && (
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, userId: user.id, username: user.username }); }}
                            className="text-destructive"
                          >
                            <Trash2 size={14} className="mr-2" /> Delete User
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Ban Dialog */}
      <Dialog open={banDialog.open} onOpenChange={(open) => setBanDialog({ ...banDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User: {banDialog.username}</DialogTitle>
            <DialogDescription>
              This will deactivate their account and revoke all sessions.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Reason for ban..."
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialog({ open: false, userId: '', username: '' })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!banReason || banMutation.isPending}
              onClick={() => banMutation.mutate({ userId: banDialog.userId, reason: banReason })}
            >
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User: {deleteDialog.username}</DialogTitle>
            <DialogDescription>
              Type <span className="text-destructive font-mono">{deleteDialog.username}</span> to confirm deletion.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Type username to confirm..."
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, userId: '', username: '' })}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={confirmText !== deleteDialog.username || deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteDialog.userId)}
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
