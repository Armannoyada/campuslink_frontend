'use client';

import { useEffect, useCallback } from 'react';
import { useUserAuthStore } from '@/store/user-auth.store';
import { userApi } from '@/lib/user-api';

export function useUserAuth() {
  const { user, isLoading, isAuthenticated, setUser, clearAuth, setLoading } = useUserAuthStore();

  const fetchUser = useCallback(async () => {
    if (useUserAuthStore.getState().hasFetched) return;
    useUserAuthStore.getState().setHasFetched();

    setLoading(true);
    try {
      const res = await userApi.get('/auth/user/me');
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
      return user.permissions.includes(permission);
    },
    [user]
  );

  const logout = useCallback(() => {
    useUserAuthStore.getState().resetAuth();
  }, []);

  return { user, isLoading, isAuthenticated, hasPermission, refetch: fetchUser, logout };
}
