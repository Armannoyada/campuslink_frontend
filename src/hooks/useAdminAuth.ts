'use client';

import { useEffect, useCallback } from 'react';
import { useAdminAuthStore } from '@/store/admin-auth.store';
import { adminApi } from '@/lib/admin-api';

export function useAdminAuth() {
  const { user, isLoading, isAuthenticated, setUser, clearAuth, setLoading } = useAdminAuthStore();

  const fetchUser = useCallback(async () => {
    if (useAdminAuthStore.getState().hasFetched) return;
    useAdminAuthStore.getState().setHasFetched();

    setLoading(true);
    try {
      const res = await adminApi.get('/auth/admin/me');
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
    useAdminAuthStore.getState().resetAuth();
  }, []);

  return { user, isLoading, isAuthenticated, hasPermission, hasRole, refetch: fetchUser, logout };
}
