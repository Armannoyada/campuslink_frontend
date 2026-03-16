import { create } from 'zustand';

export interface UserProfileData {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  phone?: string;
  dateOfBirth?: string;
  avatarUrl?: string;
  avatarType?: string;
  presetAvatarId?: number;
  collegeId?: string;
  collegeName?: string;
  isVerified: boolean;
  isActive: boolean;
  mobileVerified: boolean;
  onboardingComplete: boolean;
  lastLoginAt?: string;
  createdAt: string;
  roles: string[];
  permissions: string[];
}

interface UserAuthState {
  user: UserProfileData | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasFetched: boolean;
  setUser: (user: UserProfileData | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setHasFetched: () => void;
  resetAuth: () => void;
}

export const useUserAuthStore = create<UserAuthState>((set) => ({
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
