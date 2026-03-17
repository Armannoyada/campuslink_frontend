'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, GraduationCap, Eye, EyeOff, Mic, PlaySquare, Sparkles, Banknote, Mail, Lock, Apple } from 'lucide-react';
import { OTPInput } from '@/components/user/OTPInput';
import { ThemeToggle } from '@/components/ThemeToggle';
import { userApi } from '@/lib/user-api';
import { useUserAuthStore, UserProfileData } from '@/store/user-auth.store';

type Step = 'credentials' | 'otp';

function setAuthCookie(name: string, value: string, days: number) {
  const isProd = process.env.NODE_ENV === 'production';
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; ${isProd ? 'SameSite=None; Secure' : 'SameSite=Lax'}`;
}

export default function UserLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sessionToken, setSessionToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  function startCountdown() {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await userApi.post('/auth/user/login', { email, password });
      setSessionToken(res.data.data.sessionToken);
      setStep('otp');
      startCountdown();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || (err instanceof Error ? err.message : 'Login failed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(otp: string) {
    setError('');
    setLoading(true);
    try {
      const res = await userApi.post('/auth/user/login/verify', { sessionToken, otp });
      const data = res.data.data;
      
      // Manually set client-side cookies so middleware can see them in cross-domain prod
      setAuthCookie('user_token', data.accessToken, 0.01); // 15 mins
      setAuthCookie('user_refresh', data.refreshToken, 30);
      
      useUserAuthStore.getState().setTokens(data.accessToken, data.refreshToken, data.user as UserProfileData);
      
      if (data.user?.onboardingComplete) {
        router.push('/feed');
      } else {
        router.push('/onboarding');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || (err instanceof Error ? err.message : 'Invalid OTP'));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (countdown > 0) return;
    setError('');
    try {
      const res = await userApi.post('/auth/user/login', { email, password });
      setSessionToken(res.data.data.sessionToken);
      startCountdown();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to resend');
    }
  }

  return (
    <div className="min-h-screen flex text-slate-900 dark:text-white font-sans bg-slate-50 dark:bg-[#0E0E11] transition-colors duration-300">
      {/* Left Branding Panel (Hidden on smaller screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0A051A] flex-col justify-between overflow-hidden p-12">
          {/* Abstract Background Effects */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
              <div className="absolute top-[20%] -left-[10%] w-[80%] h-[80%] rounded-full bg-violet-600/10 blur-[100px] mix-blend-screen"></div>
          </div>

          {/* Top: Logo */}
          <div className="relative z-10 flex items-center gap-3 text-white">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/20 shadow-lg border border-white/5">
                  <GraduationCap strokeWidth={2} className="w-6 h-6 text-indigo-400" />
              </div>
              <span className="text-2xl font-bold tracking-tight">CampusLink</span>
          </div>

          {/* Middle: Value Proposition & Vibes */}
          <div className="relative z-10 max-w-lg mt-12">
              <h1 className="text-5xl sm:text-[56px] font-bold text-white tracking-tight leading-[1.1] mb-6">
                  Your campus.<br/>
                  <span className="text-indigo-400">Your vibe.</span>
              </h1>
              <p className="text-[17px] text-slate-300 font-normal leading-relaxed mb-10 max-w-md">
                  Join the ultimate student hub. Drop notes, host voice rooms, share reels, and monetize your community—all in one place.
              </p>
              
              {/* Feature Pills */}
              <div className="flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                      <Mic strokeWidth={2} className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm text-slate-200 font-medium">Voice Rooms</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                      <PlaySquare strokeWidth={2} className="w-4 h-4 text-violet-400" />
                      <span className="text-sm text-slate-200 font-medium">Reels</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                      <Sparkles strokeWidth={2} className="w-4 h-4 text-amber-400" />
                      <span className="text-sm text-slate-200 font-medium">Vibes</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                      <Banknote strokeWidth={2} className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm text-slate-200 font-medium">Earn</span>
                  </div>
              </div>
          </div>

          {/* Bottom: Footer Info */}
          <div className="relative z-10 flex items-center justify-between text-sm text-slate-500">
              <p>&copy; 2026 CampusLink.</p>
              <div className="flex gap-4">
                  <Link href="#" className="hover:text-slate-300 transition-colors">Privacy</Link>
                  <Link href="#" className="hover:text-slate-300 transition-colors">Terms</Link>
              </div>
          </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-slate-50 dark:bg-[#0E0E11] border-l border-white/5 transition-colors duration-300">
          
          <div className="absolute top-6 right-6">
            <ThemeToggle />
          </div>

          {/* Mobile Logo (Visible only on small screens) */}
          <div className="absolute top-8 left-6 sm:left-12 flex lg:hidden items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                  <GraduationCap strokeWidth={1.5} className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">CampusLink</span>
          </div>

          <div className="w-full max-w-[400px] mt-16 lg:mt-0">
              
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                  {error}
                </div>
              )}

              {step === 'credentials' ? (
                <>
                  {/* Header */}
                  <div className="mb-8">
                      <h2 className="text-[32px] font-bold tracking-tight mb-2 text-slate-900 dark:text-white">Welcome back</h2>
                      <p className="text-[15px] text-slate-500 dark:text-slate-400">Enter your credentials to continue to your campus.</p>
                  </div>

                  {/* Social Logins */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                      <button type="button" className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-[14px] bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 text-[15px] font-medium transition-colors text-slate-900 dark:text-white">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          Google
                      </button>
                      <button type="button" className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-slate-200 dark:border-white/10 rounded-[14px] bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 text-[15px] font-medium transition-colors text-slate-900 dark:text-white">
                          <Apple strokeWidth={2} className="w-5 h-5 text-slate-900 dark:text-white" />
                          Apple
                      </button>
                  </div>

                  <div className="relative mb-8">
                      <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200 dark:border-white/10"></div>
                      </div>
                      <div className="relative flex justify-center text-[13px]">
                          <span className="px-4 bg-slate-50 dark:bg-[#0E0E11] text-slate-500">Or continue with email</span>
                      </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleLogin} className="space-y-5">
                      <div>
                          <label htmlFor="email" className="block text-[15px] font-medium text-slate-700 dark:text-slate-300 mb-2">Email address</label>
                          <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                                  <Mail strokeWidth={2} className="w-5 h-5" />
                              </div>
                              <input id="email" name="email" type="email" autoComplete="email" required 
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  className="block w-full pl-12 pr-4 py-3.5 bg-transparent border border-slate-200 dark:border-white/10 rounded-[14px] text-[15px] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                                  placeholder="you@campus.edu" />
                          </div>
                      </div>

                      <div>
                          <div className="flex items-center justify-between mb-2">
                              <label htmlFor="password" className="block text-[15px] font-medium text-slate-700 dark:text-slate-300">Password</label>
                              <Link href="/forgot-password" className="text-[13px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors">Forgot password?</Link>
                          </div>
                          <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                                  <Lock strokeWidth={2} className="w-5 h-5" />
                              </div>
                              <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required 
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  className="block w-full pl-12 pr-12 py-3.5 bg-transparent border border-slate-200 dark:border-white/10 rounded-[14px] text-[15px] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all" 
                                  placeholder="••••••••" />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                                  {showPassword ? <EyeOff strokeWidth={2} className="w-5 h-5" /> : <Eye strokeWidth={2} className="w-5 h-5" />}
                              </button>
                          </div>
                      </div>

                      <div className="pt-2">
                          <button type="submit" disabled={loading} className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-[14px] shadow-sm text-[16px] font-semibold text-white bg-[#5E43F3] hover:bg-[#4d35d9] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5E43F3] focus:ring-offset-[#0E0E11] transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100">
                              {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
                              Sign in
                          </button>
                      </div>
                  </form>

                  <div className="mt-8 text-center">
                      <p className="text-[15px] text-slate-500 dark:text-slate-400">
                          Don't have an account? 
                          <Link href="/signup" className="ml-1.5 font-semibold text-slate-900 dark:text-white hover:underline underline-offset-4">Sign up</Link>
                      </p>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  {/* OTP Header */}
                  <div className="mb-8 mt-12 lg:mt-0 text-center">
                      <h2 className="text-[32px] font-bold tracking-tight mb-3 text-slate-900 dark:text-white">Check your email</h2>
                      <p className="text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed">We sent a 6-digit code to <span className="text-slate-900 dark:text-white font-medium">{email}</span></p>
                  </div>

                  <OTPInput
                    length={6}
                    onComplete={handleVerifyOTP}
                    disabled={loading}
                  />

                  {loading && (
                    <div className="flex justify-center">
                      <Loader2 className="animate-spin text-[#5E43F3]" size={24} />
                    </div>
                  )}

                  <div className="text-center mt-10">
                    <p className="text-[14px] text-slate-500 dark:text-slate-400">
                      Didn't receive the code?{' '}
                      {countdown > 0 ? (
                        <span className="text-slate-900 dark:text-white font-medium">Resend in {countdown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResend}
                          className="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                        >
                          Resend OTP
                        </button>
                      )}
                    </p>
                    <button
                      onClick={() => { setStep('credentials'); setError(''); }}
                      className="mt-6 text-[14px] text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Wait, let me change my email
                    </button>
                  </div>
                </div>
              )}
          </div>
      </div>
    </div>
  );
}
