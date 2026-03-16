'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  GraduationCap,
  Home,
  Search,
  Bell,
  MessageCircle,
  User,
  Settings,
  LogOut,
  PlusCircle,
  TrendingUp,
  Users,
  Loader2,
} from 'lucide-react';
import { useUserAuth } from '@/hooks/useUserAuth';
import { userApi } from '@/lib/user-api';
import { useUserAuthStore } from '@/store/user-auth.store';

export default function FeedPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useUserAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !user.onboardingComplete) {
      router.replace('/onboarding');
    }
  }, [isLoading, isAuthenticated, user, router]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      const refreshToken = useUserAuthStore.getState().refreshToken;
      await userApi.post('/auth/user/logout', { refreshToken });
    } catch {
      // ignore
    } finally {
      useUserAuthStore.getState().clearAuth();
      router.push('/login');
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-violet-600" size={36} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top navigation */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <GraduationCap className="text-white" size={18} />
            </div>
            <span className="text-lg font-bold text-foreground hidden sm:block">CampusLink</span>
          </div>

          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search posts, people, topics..."
                className="pl-9 h-9 bg-gray-100 dark:bg-gray-800 border-0"
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell size={20} />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <MessageCircle size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? <Loader2 className="animate-spin" size={20} /> : <LogOut size={20} />}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left sidebar — profile */}
          <aside className="hidden lg:block lg:col-span-3">
            <Card className="sticky top-20">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-linear-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                    {user?.displayName?.[0] || user?.username?.[0] || '?'}
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {user?.displayName || user?.username || 'Student'}
                  </h3>
                  <p className="text-sm text-muted-foreground">@{user?.username}</p>
                  {user?.collegeName && (
                    <p className="text-xs text-muted-foreground mt-1">{user.collegeName}</p>
                  )}
                </div>
                <div className="mt-4 space-y-1">
                  <NavItem icon={Home} label="Feed" active />
                  <NavItem icon={User} label="Profile" />
                  <NavItem icon={Settings} label="Settings" />
                </div>
              </CardContent>
            </Card>
          </aside>

          {/* Center — feed */}
          <main className="lg:col-span-6 space-y-4">
            {/* Create post */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-linear-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-bold shrink-0">
                    {user?.displayName?.[0] || user?.username?.[0] || '?'}
                  </div>
                  <Input
                    placeholder="What's on your mind?"
                    className="bg-gray-100 dark:bg-gray-800 border-0 rounded-full cursor-pointer"
                    readOnly
                  />
                  <Button
                    size="icon"
                    className="rounded-full bg-linear-to-r from-violet-600 to-indigo-600 shrink-0"
                  >
                    <PlusCircle size={18} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Welcome card */}
            <Card className="border-violet-200 dark:border-violet-800 bg-linear-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  Welcome to CampusLink{user?.displayName ? `, ${user.displayName}` : ''}!
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Your campus feed is ready. Connect with classmates, join communities, share your thoughts, and discover what&apos;s happening around campus.
                </p>
              </CardContent>
            </Card>

            {/* Empty state */}
            <Card>
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="text-muted-foreground" size={28} />
                </div>
                <h4 className="font-semibold text-foreground mb-1">Your feed is empty</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Follow people and join communities to see posts here.
                </p>
                <Button className="bg-linear-to-r from-violet-600 to-indigo-600">
                  Explore Communities
                </Button>
              </CardContent>
            </Card>
          </main>

          {/* Right sidebar — suggestions */}
          <aside className="hidden lg:block lg:col-span-3">
            <Card className="sticky top-20">
              <CardContent className="p-4">
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <TrendingUp size={16} /> Trending
                </h4>
                <div className="space-y-3 text-sm">
                  {['#CampusFest2025', '#ExamSeason', '#PlacementDrive'].map((tag) => (
                    <div key={tag} className="text-primary hover:underline cursor-pointer">
                      {tag}
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Users size={16} /> Suggested
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Follow people from your college to get started.
                  </p>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  active = false,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300'
          : 'text-muted-foreground hover:bg-accent'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}
