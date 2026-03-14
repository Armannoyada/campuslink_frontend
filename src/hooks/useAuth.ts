'use client';

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/api';

export function useAuth() {
  const { user, isLoading, isAuthenticated, setUser, clearUser, setLoading } = useAuthStore();

  const fetchUser = useCallback(async () => {
    // Synchronous guard: prevents duplicate fetches across multiple components.
    // Uses getState() so the check+set is atomic within a single JS task.
    if (useAuthStore.getState().hasFetched) return;
    useAuthStore.getState().setHasFetched();

    setLoading(true);
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data);
    } catch {
      clearUser();
    }
  }, [setUser, clearUser, setLoading]);

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
    useAuthStore.getState().resetAuth();
  }, []);

  return { user, isLoading, isAuthenticated, hasPermission, hasRole, refetch: fetchUser, logout };
}
