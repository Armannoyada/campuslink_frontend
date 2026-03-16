'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, GraduationCap, Mail, Eye, EyeOff } from 'lucide-react';
import { OTPInput } from '@/components/user/OTPInput';
import { PasswordStrength } from '@/components/user/PasswordStrength';
import { userApi } from '@/lib/user-api';
import { useUserAuthStore } from '@/store/user-auth.store';

type Step = 'details' | 'otp';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('details');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  function isPasswordValid(pw: string) {
    return (
      pw.length >= 8 &&
      /[A-Z]/.test(pw) &&
      /[a-z]/.test(pw) &&
      /[0-9]/.test(pw) &&
      /[^A-Za-z0-9]/.test(pw)
    );
  }

  async function handleSendOTP(e: FormEvent) {
    e.preventDefault();
    if (!isPasswordValid(password)) {
      setError('Password must be 8+ chars with uppercase, lowercase, number, and special character.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await userApi.post('/auth/signup/initiate', { email });
      setStep('otp');
      startCountdown();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || (err instanceof Error ? err.message : 'Failed to send OTP'));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(otp: string) {
    setError('');
    setLoading(true);
    try {
      const res = await userApi.post('/auth/signup/verify', { email, otp, password });
      const { accessToken, refreshToken } = res.data.data;
      useUserAuthStore.getState().setTokens(accessToken, refreshToken);
      router.push('/onboarding');
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
      await userApi.post('/auth/signup/initiate', { email });
      startCountdown();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to resend');
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-violet-600 via-purple-600 to-indigo-700 p-12 flex-col justify-between text-white">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <GraduationCap size={24} />
            </div>
            <h1 className="text-2xl font-bold">CampusLink</h1>
          </div>
          <h2 className="text-4xl font-bold leading-tight mt-16">
            Connect with your<br />campus community
          </h2>
          <p className="text-lg text-white/80 mt-4 max-w-md">
            Join thousands of students sharing ideas, events, and opportunities at your college.
          </p>
        </div>
        <p className="text-sm text-white/50">
          &copy; {new Date().getFullYear()} CampusLink. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile branding */}
          <div className="lg:hidden text-center mb-8">
            <div className="h-12 w-12 rounded-xl bg-linear-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-bold text-foreground">CampusLink</h1>
          </div>

          <Card className="border shadow-sm">
            <CardHeader className="pb-4">
              {step === 'otp' && (
                <button
                  onClick={() => { setStep('details'); setError(''); }}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2 transition-colors"
                >
                  <ArrowLeft size={16} /> Back
                </button>
              )}
              <h2 className="text-2xl font-bold text-foreground">
                {step === 'details' ? 'Create your account' : 'Verify your email'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {step === 'details'
                  ? 'Enter your email and create a password'
                  : `We sent a 6-digit code to ${email}`}
              </p>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              {step === 'details' ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">College Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@college.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {password && <PasswordStrength password={password} />}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !isPasswordValid(password)}
                    className="w-full bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                  >
                    {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                    Continue
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/login" className="text-primary font-medium hover:underline">
                      Sign in
                    </Link>
                  </p>
                </form>
              ) : (
                <div className="space-y-6">
                  <OTPInput
                    length={6}
                    onComplete={handleVerifyOTP}
                    disabled={loading}
                  />

                  {loading && (
                    <div className="flex justify-center">
                      <Loader2 className="animate-spin text-primary" size={24} />
                    </div>
                  )}

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Didn&apos;t receive the code?{' '}
                      {countdown > 0 ? (
                        <span className="text-foreground font-medium">Resend in {countdown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResend}
                          className="text-primary font-medium hover:underline"
                        >
                          Resend OTP
                        </button>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
