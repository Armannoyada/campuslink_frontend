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
  isLoading: boolean;
  isAuthenticated: boolean;
  hasFetched: boolean;
  setUser: (user: UserData | null) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
  setHasFetched: () => void;
  resetAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  hasFetched: false,
  setUser: (user) =>
    set({ user, isAuthenticated: !!user, isLoading: false }),
  clearUser: () =>
    set({ user: null, isAuthenticated: false, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  setHasFetched: () => set({ hasFetched: true }),
  resetAuth: () =>
    set({ user: null, isAuthenticated: false, isLoading: true, hasFetched: false }),
}));
