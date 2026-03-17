'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ThemeToggle';
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0E0E11] transition-colors duration-300">
      {/* Top navigation */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0A051A]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <GraduationCap className="text-white" size={18} />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white hidden sm:block">CampusLink</span>
          </div>

          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-500 transition-colors" size={16} />
              <Input
                placeholder="Search posts, people, topics..."
                className="pl-9 h-[42px] bg-slate-100 dark:bg-white/5 border border-transparent dark:border-white/10 text-[15px] text-slate-900 dark:text-white placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-indigo-500 rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
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
                  <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                    {user?.displayName || user?.username || 'Student'}
                  </h3>
                  <p className="text-[14px] text-slate-500">@{user?.username}</p>
                  {user?.collegeName && (
                    <p className="text-[13px] font-medium text-indigo-600 dark:text-indigo-400 mt-1">{user.collegeName}</p>
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
                    className="h-[46px] bg-slate-100 dark:bg-white/5 border border-transparent dark:border-white/10 text-[15px] text-slate-900 dark:text-white placeholder:text-slate-500 rounded-full cursor-pointer hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                    readOnly
                  />
                  <Button
                    size="icon"
                    className="w-[46px] h-[46px] rounded-full bg-linear-to-r from-violet-600 to-indigo-600 shadow-md shadow-indigo-500/20 shrink-0"
                  >
                    <PlusCircle size={18} />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Welcome card */}
            <Card className="border border-indigo-500/20 dark:border-indigo-500/20 bg-linear-to-r from-indigo-50/50 to-violet-50/50 dark:from-indigo-500/10 dark:to-violet-500/10 shadow-none">
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-3">🎉</div>
                <h3 className="text-[18px] font-bold text-slate-900 dark:text-white mb-2">
                  Welcome to CampusLink{user?.displayName ? `, ${user.displayName}` : ''}!
                </h3>
                <p className="text-[14px] text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  Your campus feed is ready. Connect with classmates, join communities, share your thoughts, and discover what&apos;s happening around campus.
                </p>
              </CardContent>
            </Card>

            {/* Empty state */}
            <Card className="border-dashed border-2 bg-transparent shadow-none dark:border-white/10 dark:bg-transparent">
              <CardContent className="p-10 text-center">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-5 rotate-3 transition-transform hover:rotate-6">
                  <GraduationCap className="text-indigo-500" size={32} />
                </div>
                <h4 className="text-[16px] font-bold text-slate-900 dark:text-white mb-2">Your feed is empty</h4>
                <p className="text-[14px] text-slate-500 mb-6 max-w-[250px] mx-auto">
                  Follow people and join communities to see posts here.
                </p>
                <Button className="h-[46px] px-6 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 shadow-md shadow-indigo-500/20 font-semibold text-[15px]">
                  Explore Communities
                </Button>
              </CardContent>
            </Card>
          </main>

          {/* Right sidebar — suggestions */}
          <aside className="hidden lg:block lg:col-span-3">
            <Card className="sticky top-20">
              <CardContent className="p-5">
                <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 text-[15px]">
                  <TrendingUp size={18} className="text-indigo-500" /> Trending
                </h4>
                <div className="space-y-4 text-[14px] font-medium">
                  {['#CampusFest2025', '#ExamSeason', '#PlacementDrive'].map((tag) => (
                    <div key={tag} className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">
                      {tag}
                    </div>
                  ))}
                </div>

                <div className="mt-8">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2 text-[15px]">
                    <Users size={18} className="text-violet-500" /> Suggested
                  </h4>
                  <p className="text-[13px] text-slate-500 leading-relaxed">
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-semibold transition-colors ${
        active
          ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}
