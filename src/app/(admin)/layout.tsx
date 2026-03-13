'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Shield,
  FileWarning,
  BarChart3,
  LogOut,
  ChevronLeft,
  Menu,
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
  const [collapsed, setCollapsed] = useState(false);

  const filteredNav = navItems.filter((item) => hasPermission(item.permission));

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
      <div className="flex h-screen bg-[#0F172A]">
        <div className="w-64 bg-[#1E293B] p-4 space-y-4">
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
        <div className="p-4">
          <h1 className="text-xl font-bold text-[#1A73E8]">
            {collapsed ? 'CL' : 'CampusLink'}
          </h1>
          <p className={`text-xs text-slate-500 mt-1 ${collapsed ? 'hidden' : ''}`}>
            Admin Panel
          </p>
        </div>

        <Separator className="bg-slate-700" />

        <nav className="flex-1 p-2 space-y-1">
          {filteredNav.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-[#1A73E8]/10 text-[#1A73E8]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <Separator className="bg-slate-700" />

        <div className="p-4">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#1A73E8] text-white text-xs">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 truncate">{user?.username}</p>
                <p className="text-xs text-slate-500 truncate">{user?.roles[0] || 'Admin'}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={`mt-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 ${collapsed ? 'w-full px-0' : 'w-full'}`}
          >
            <LogOut size={18} />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0F172A]">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-[#1E293B] border-r border-slate-700 transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 text-slate-500 hover:text-slate-300 border-t border-slate-700"
        >
          <ChevronLeft className={`mx-auto transition-transform ${collapsed ? 'rotate-180' : ''}`} size={18} />
        </button>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet>
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#1E293B] border-b border-slate-700 px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-[#1A73E8]">CampusLink</h1>
          <SheetTrigger className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-700">
            <Menu size={20} />
          </SheetTrigger>
        </div>
        <SheetContent side="left" className="w-64 p-0 bg-[#1E293B] border-slate-700">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-auto md:pt-0 pt-14">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
