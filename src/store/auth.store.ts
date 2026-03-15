import { create } from 'zustand';

export interface UserData {
  id: string;
  email: string;
  username: string;
  phone?: string;
  isVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  roles: string[];
  permissions: string[];
}

interface AuthState {
  user: UserData | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasFetched: boolean;
  setUser: (user: UserData | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setHasFetched: () => void;
  resetAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
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
  clearUser: () =>
    set({ user: null, isAuthenticated: false, isLoading: false, accessToken: null, refreshToken: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setHasFetched: () => set({ hasFetched: true }),
  resetAuth: () =>
    set({ user: null, isAuthenticated: false, isLoading: true, hasFetched: false, accessToken: null, refreshToken: null }),
}));
