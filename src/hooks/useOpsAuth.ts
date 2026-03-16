'use client';

import { useEffect, useCallback } from 'react';
import { useOpsAuthStore } from '@/store/ops-auth.store';
import { opsApi } from '@/lib/ops-api';

export function useOpsAuth() {
  const { user, isLoading, isAuthenticated, setUser, clearAuth, setLoading } = useOpsAuthStore();

  const fetchUser = useCallback(async () => {
    if (useOpsAuthStore.getState().hasFetched) return;
    useOpsAuthStore.getState().setHasFetched();

    setLoading(true);
    try {
      const res = await opsApi.get('/auth/ops/me');
      setUser(res.data.data);
    } catch {
      clearAuth();
    }
  }, [setUser, clearAuth, setLoading]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (user.permissions.includes('*')) return true;
      return user.permissions.includes(permission);
    },
    [user]
  );

  const hasRole = useCallback(
    (role: string): boolean => {
      if (!user) return false;
      return user.roles.includes(role);
    },
    [user]
  );

  const logout = useCallback(() => {
    useOpsAuthStore.getState().resetAuth();
  }, []);

  return { user, isLoading, isAuthenticated, hasPermission, hasRole, refetch: fetchUser, logout };
}
