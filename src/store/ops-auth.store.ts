import { create } from 'zustand';

export interface OpsUserData {
  id: string;
  email: string;
  username: string;
  isVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  roles: string[];
  permissions: string[];
}

interface OpsAuthState {
  user: OpsUserData | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasFetched: boolean;
  setUser: (user: OpsUserData | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setHasFetched: () => void;
  resetAuth: () => void;
}

export const useOpsAuthStore = create<OpsAuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,
  hasFetched: false,
  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),
  setTokens: (accessToken, refreshToken) =>
    set({ accessToken, refreshToken }),
  setAccessToken: (accessToken) =>
    set({ accessToken }),
  clearAuth: () =>
    set({ user: null, isAuthenticated: false, isLoading: false, accessToken: null, refreshToken: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setHasFetched: () => set({ hasFetched: true }),
  resetAuth: () =>
    set({ user: null, isAuthenticated: false, isLoading: true, hasFetched: false, accessToken: null, refreshToken: null }),
}));
