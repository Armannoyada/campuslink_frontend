'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2, Headset } from 'lucide-react';
import { opsApi } from '@/lib/ops-api';
import { useOpsAuthStore } from '@/store/ops-auth.store';

export default function OpsLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await opsApi.post('/auth/ops/login', { email, password });
      const { accessToken, refreshToken } = res.data.data;
      useOpsAuthStore.getState().setTokens(accessToken, refreshToken);
      router.push('/operations/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-teal-50/50 dark:bg-background">
      <Card className="w-full max-w-md shadow-lg border">
        <CardHeader className="text-center pb-2">
          <div className="mb-2">
            <div className="h-12 w-12 rounded-xl bg-teal-600 flex items-center justify-center mx-auto mb-3">
              <Headset className="text-white" size={24} />
            </div>
            <h1 className="text-xl font-semibold text-foreground">CampusLink</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Operations Portal</p>
          </div>
          <CardTitle className="text-lg text-foreground">
            Sign in to your account
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="ops@campuslink.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
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
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700">
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              Sign In
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Operations team access only. Contact your admin for credentials.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
