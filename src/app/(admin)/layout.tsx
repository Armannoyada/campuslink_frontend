'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard,
  Users,
  Shield,
  FileWarning,
  BarChart3,
  LogOut,
  ChevronLeft,
  Menu,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import api from '@/lib/api';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'analytics:read' },
  { href: '/users', label: 'Users', icon: Users, permission: 'users:read' },
  { href: '/roles', label: 'Roles', icon: Shield, permission: 'roles:read' },
  { href: '/content', label: 'Content', icon: FileWarning, permission: 'content:review' },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, permission: 'analytics:read' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, hasPermission } = useAuth();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const filteredNav = navItems.filter((item) => hasPermission(item.permission));

  if (!isLoading && !user) {
    router.push('/login');
    return null;
  }

  async function handleLogout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore
    }
    router.push('/login');
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <div className="w-64 border-r border-border bg-card p-4 space-y-4">
          <Skeleton className="h-8 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  function SidebarContent() {
    return (
      <div className="flex flex-col h-full">
        <div className="p-5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">CL</span>
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-base font-semibold text-foreground tracking-tight">
                  CampusLink
                </h1>
                <p className="text-[11px] text-muted-foreground -mt-0.5">Admin Panel</p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <nav className="flex-1 p-3 space-y-1">
          {filteredNav.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                }`}
              >
                <Icon size={18} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <Separator />

        <div className="p-4 space-y-3">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {!collapsed && <span className="ml-2">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
          </Button>

          <Separator />

          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user?.username}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">{user?.roles[0]?.replace('_', ' ') || 'Admin'}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={`text-muted-foreground hover:text-destructive hover:bg-destructive/10 ${collapsed ? 'w-full px-0' : 'w-full justify-start'}`}
          >
            <LogOut size={16} />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col border-r border-border bg-card transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2.5 text-muted-foreground hover:text-foreground border-t border-border transition-colors"
        >
          <ChevronLeft className={`mx-auto transition-transform ${collapsed ? 'rotate-180' : ''}`} size={16} />
        </button>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">CL</span>
            </div>
            <h1 className="text-base font-semibold text-foreground">CampusLink</h1>
          </div>
          <SheetTrigger className="inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-accent">
            <Menu size={20} />
          </SheetTrigger>
        </div>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:pt-0 pt-14">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
