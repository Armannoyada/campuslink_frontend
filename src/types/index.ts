export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  hasMore: boolean;
  nextCursor: string | null;
}

export interface User {
  id: string;
  email: string;
  username: string;
  phone?: string;
  isVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  roles: Role[];
}

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isSystem: boolean;
  createdAt: string;
  permissionCount?: number;
  userCount?: number;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  displayName: string;
  resource: string;
  action: string;
  description?: string;
}

export interface AuditLog {
  id: string;
  actorId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  deviceInfo?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: string;
  revokedAt?: string;
  createdAt: string;
}

export interface ContentReport {
  id: string;
  reporterId: string;
  contentType: string;
  contentId: string;
  reason: string;
  description?: string;
  status: string;
  severity: number;
  reviewedBy?: string;
  reviewedAt?: string;
  actionTaken?: string;
  createdAt: string;
  reporter?: { id: string; email: string; username: string };
}

export interface PlatformStats {
  totalUsers: number;
  activeToday: number;
  newThisWeek: number;
  pendingReports: number;
  mrr: number;
}

export interface UserGrowthItem {
  date: string;
  newSignups: number;
  cumulative: number;
}

export interface RetentionSnapshot {
  dau: number;
  wau: number;
  mau: number;
}
