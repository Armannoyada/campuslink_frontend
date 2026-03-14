'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Shield, Plus, Users, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import type { Role, Permission } from '@/types';
import { toast } from 'sonner';

export default function RolesPage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newRole, setNewRole] = useState({ displayName: '', description: '' });
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);

  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/roles');
      return res.data.data as (Role & { permissionCount: number; userCount: number })[];
    },
  });

  const { data: roleDetail } = useQuery({
    queryKey: ['role', selectedRoleId],
    queryFn: async () => {
      const res = await api.get(`/roles/${selectedRoleId}`);
      return res.data.data as Role & { permissions: Permission[] };
    },
    enabled: !!selectedRoleId,
  });

  const { data: allPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await api.get('/roles/permissions');
      return res.data.data as Permission[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; displayName: string; description: string; permissionIds: string[] }) => {
      await api.post('/roles', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setCreateOpen(false);
      setNewRole({ displayName: '', description: '' });
      setSelectedPermIds([]);
      toast.success('Role created');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, permissionIds }: { id: string; permissionIds: string[] }) => {
      await api.patch(`/roles/${id}`, { permissionIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['role', selectedRoleId] });
      toast.success('Role updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSelectedRoleId(null);
      toast.success('Role deleted');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Group permissions by resource
  function groupPermissions(perms: Permission[]) {
    const groups: Record<string, Permission[]> = {};
    for (const perm of perms) {
      if (!groups[perm.resource]) groups[perm.resource] = [];
      groups[perm.resource].push(perm);
    }
    return groups;
  }

  function handleCreateRole() {
    const name = newRole.displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    createMutation.mutate({
      name,
      displayName: newRole.displayName,
      description: newRole.description,
      permissionIds: selectedPermIds,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Roles & Permissions</h1>
        {hasPermission('roles:create') && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={18} className="mr-2" /> Create Role
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="space-y-2">
          {rolesLoading ? (
            Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : (
            rolesData?.map((role) => (
              <Card
                key={role.id}
                className={`cursor-pointer transition-colors ${
                  selectedRoleId === role.id ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedRoleId(role.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield size={18} className={selectedRoleId === role.id ? 'text-primary' : 'text-muted-foreground'} />
                      <div>
                        <p className="text-foreground font-medium">{role.displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {role.permissionCount} permissions • {role.userCount} users
                        </p>
                      </div>
                    </div>
                    {role.isSystem && (
                      <Badge variant="outline" className="text-xs">
                        <Lock size={10} className="mr-1" /> System
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Role Detail */}
        <div className="lg:col-span-2">
          {selectedRoleId && roleDetail ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{roleDetail.displayName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{roleDetail.description || 'No description'}</p>
                  </div>
                  {!roleDetail.isSystem && hasPermission('roles:delete') && (
                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(roleDetail.id)}>
                      Delete
                    </Button>
                  )}
                </div>
                {roleDetail.isSystem && (
                  <div className="p-3 rounded-md bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-sm mt-2">
                    System Role — Cannot be deleted
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <h3 className="text-foreground font-medium mb-4">Permission Matrix</h3>
                {allPermissions && (
                  <div className="space-y-4">
                    {Object.entries(groupPermissions(allPermissions)).map(([resource, perms]) => (
                      <div key={resource}>
                        <p className="text-sm font-medium text-foreground capitalize mb-2">{resource}</p>
                        <div className="flex flex-wrap gap-3">
                          {perms.map((perm) => {
                            const isChecked = roleDetail.permissions?.some((p) => p.id === perm.id) || false;
                            return (
                              <label
                                key={perm.id}
                                className="flex items-center gap-2 text-sm text-muted-foreground"
                              >
                                <Checkbox
                                  checked={isChecked}
                                  disabled={roleDetail.isSystem || !hasPermission('roles:update')}
                                  onCheckedChange={(checked) => {
                                    const currentIds = roleDetail.permissions?.map((p) => p.id) || [];
                                    const newIds = checked
                                      ? [...currentIds, perm.id]
                                      : currentIds.filter((id) => id !== perm.id);
                                    updateMutation.mutate({ id: roleDetail.id, permissionIds: newIds });
                                  }}
                                />
                                {perm.action}
                              </label>
                            );
                          })}
                        </div>
                        <Separator className="mt-3" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                Select a role to view details
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Role Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Display Name</Label>
              <Input
                value={newRole.displayName}
                onChange={(e) => setNewRole({ ...newRole, displayName: e.target.value })}
                placeholder="Content Moderator"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Slug: {newRole.displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}
              </p>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                placeholder="Moderates content and reviews reports"
              />
            </div>
            {allPermissions && (
              <div>
                <Label className="mb-2 block">Permissions</Label>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {allPermissions.map((perm) => (
                    <label key={perm.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Checkbox
                        checked={selectedPermIds.includes(perm.id)}
                        onCheckedChange={(checked) => {
                          setSelectedPermIds(
                            checked
                              ? [...selectedPermIds, perm.id]
                              : selectedPermIds.filter((id) => id !== perm.id)
                          );
                        }}
                      />
                      {perm.displayName} ({perm.name})
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRole}
              disabled={!newRole.displayName || createMutation.isPending}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
