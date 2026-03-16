'use client';

import { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  Search,
  GraduationCap,
  User,
  Building2,
  Phone,
  Calendar,
  Palette,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { CountryPhoneInput } from '@/components/user/CountryPhoneInput';
import { userApi } from '@/lib/user-api';
import { useUserAuthStore } from '@/store/user-auth.store';

const STEPS = [
  { key: 'name', label: 'Your Name', icon: User },
  { key: 'college', label: 'College', icon: Building2 },
  { key: 'mobile', label: 'Mobile', icon: Phone },
  { key: 'dob', label: 'Birthday', icon: Calendar },
  { key: 'avatar', label: 'Avatar', icon: Palette },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

interface College {
  id: string;
  name: string;
  shortName?: string;
  city?: string;
  state?: string;
  type?: string;
}

const PRESET_AVATARS = Array.from({ length: 20 }, (_, i) => i + 1);
const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
  'bg-teal-500', 'bg-orange-500',
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Name & Username
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 2: College
  const [collegeSearch, setCollegeSearch] = useState('');
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [searchingColleges, setSearchingColleges] = useState(false);
  const collegeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 3: Mobile
  const [phoneValue, setPhoneValue] = useState('');

  // Step 4: DOB
  const [dob, setDob] = useState('');

  // Step 5: Avatar
  const [avatarType, setAvatarType] = useState<'preset' | 'upload'>('preset');
  const [presetAvatarId, setPresetAvatarId] = useState<number | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');

  // Username availability check
  const checkUsername = useCallback(async (u: string) => {
    if (u.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    try {
      const res = await userApi.get(`/auth/check-username?u=${encodeURIComponent(u)}`);
      const data = res.data.data;
      setUsernameStatus(data.available ? 'available' : 'taken');
      if (!data.available && data.suggestions) {
        setUsernameSuggestions(data.suggestions);
      } else {
        setUsernameSuggestions([]);
      }
    } catch {
      setUsernameStatus('idle');
    }
  }, []);

  useEffect(() => {
    if (usernameTimer.current) clearTimeout(usernameTimer.current);
    if (username.length >= 3) {
      usernameTimer.current = setTimeout(() => checkUsername(username), 400);
    } else {
      setUsernameStatus('idle');
    }
    return () => {
      if (usernameTimer.current) clearTimeout(usernameTimer.current);
    };
  }, [username, checkUsername]);

  // College search
  useEffect(() => {
    if (collegeTimer.current) clearTimeout(collegeTimer.current);
    if (collegeSearch.length >= 2) {
      collegeTimer.current = setTimeout(async () => {
        setSearchingColleges(true);
        try {
          const res = await userApi.get(`/colleges/search?q=${encodeURIComponent(collegeSearch)}&limit=10`);
          setColleges(res.data.data || []);
        } catch {
          setColleges([]);
        } finally {
          setSearchingColleges(false);
        }
      }, 300);
    } else {
      setColleges([]);
    }
    return () => {
      if (collegeTimer.current) clearTimeout(collegeTimer.current);
    };
  }, [collegeSearch]);

  function canProceed(): boolean {
    const step = STEPS[currentStep].key;
    switch (step) {
      case 'name':
        return firstName.length >= 2 && username.length >= 3 && usernameStatus === 'available';
      case 'college':
        return true; // College is optional
      case 'mobile':
        return true; // Mobile is optional
      case 'dob':
        return true; // DOB is optional
      case 'avatar':
        return avatarType === 'preset' ? presetAvatarId !== null : avatarUrl.length > 0;
      default:
        return false;
    }
  }


  async function handleComplete() {
    setError('');
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        firstName,
        username: username.toLowerCase(),
      };
      if (lastName) payload.lastName = lastName;
      if (selectedCollege) payload.collegeId = selectedCollege.id;
      if (phoneValue) payload.phoneNumber = phoneValue;
      if (dob) payload.dob = dob;
      if (avatarType === 'preset' && presetAvatarId) {
        payload.avatarType = 'preset';
        payload.presetAvatarId = presetAvatarId;
      } else if (avatarType === 'upload' && avatarUrl) {
        payload.avatarType = 'upload';
        payload.avatarUrl = avatarUrl;
      }

      const res = await userApi.patch('/auth/user/onboarding', payload);
      const data = res.data.data;
      if (data.accessToken) {
        useUserAuthStore.getState().setAccessToken(data.accessToken);
      }
      router.push('/feed');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  }

  function handleNext() {
    if (currentStep === STEPS.length - 1) {
      handleComplete();
    } else {
      setError('');
      setCurrentStep((s) => s + 1);
    }
  }

  function handleBack() {
    setError('');
    setCurrentStep((s) => Math.max(0, s - 1));
  }

  function handleSkip() {
    setError('');
    setCurrentStep((s) => s + 1);
  }

  const isSkippable = ['college', 'mobile', 'dob'].includes(STEPS[currentStep].key);
  const stepKey = STEPS[currentStep].key;

  // Get max date for DOB (must be at least 13 years old)
  const maxDob = new Date();
  maxDob.setFullYear(maxDob.getFullYear() - 13);
  const maxDobStr = maxDob.toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-linear-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isDone = i < currentStep;
              const isActive = i === currentStep;
              return (
                <div key={step.key} className="flex flex-col items-center gap-1">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      isDone
                        ? 'bg-violet-600 text-white'
                        : isActive
                        ? 'bg-violet-600 text-white ring-4 ring-violet-200 dark:ring-violet-900'
                        : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {isDone ? <Check size={18} /> : <Icon size={18} />}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:block ${
                      isActive ? 'text-violet-700 dark:text-violet-400' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-violet-600 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <Card className="border shadow-lg">
          <CardHeader className="pb-2">
            <h2 className="text-2xl font-bold text-foreground">
              {stepKey === 'name' && 'What should we call you?'}
              {stepKey === 'college' && 'Select your college'}
              {stepKey === 'mobile' && 'Add your mobile number'}
              {stepKey === 'dob' && 'When is your birthday?'}
              {stepKey === 'avatar' && 'Choose your avatar'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {stepKey === 'name' && 'Set your display name and pick a unique username'}
              {stepKey === 'college' && 'Find and select your college to connect with peers'}
              {stepKey === 'mobile' && 'Verify your number for account security'}
              {stepKey === 'dob' && 'We use this to show age-appropriate content'}
              {stepKey === 'avatar' && 'Pick an avatar that represents you'}
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            {/* Step 1: Name & Username */}
            {stepKey === 'name' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                    <Input
                      id="username"
                      placeholder="johndoe"
                      value={username}
                      onChange={(e) =>
                        setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                      }
                      className="pl-8"
                      maxLength={30}
                    />
                    {usernameStatus === 'checking' && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" size={16} />
                    )}
                    {usernameStatus === 'available' && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" size={16} />
                    )}
                    {usernameStatus === 'taken' && (
                      <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" size={16} />
                    )}
                  </div>
                  {usernameStatus === 'taken' && usernameSuggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">Try:</span>
                      {usernameSuggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setUsername(s)}
                          className="text-xs text-primary hover:underline"
                        >
                          @{s}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    3-30 characters, lowercase letters, numbers, and underscores only
                  </p>
                </div>
              </div>
            )}

            {/* Step 2: College */}
            {stepKey === 'college' && (
              <div className="space-y-4">
                {selectedCollege ? (
                  <div className="p-4 rounded-xl border-2 border-violet-500 bg-violet-50 dark:bg-violet-950/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{selectedCollege.name}</p>
                        {selectedCollege.shortName && (
                          <p className="text-sm text-muted-foreground">{selectedCollege.shortName}</p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          {[selectedCollege.city, selectedCollege.state].filter(Boolean).join(', ')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCollege(null);
                          setCollegeSearch('');
                        }}
                        className="text-sm text-primary hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                      <Input
                        placeholder="Search by college name or city..."
                        value={collegeSearch}
                        onChange={(e) => setCollegeSearch(e.target.value)}
                        className="pl-10"
                        autoFocus
                      />
                      {searchingColleges && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" size={16} />
                      )}
                    </div>
                    {colleges.length > 0 && (
                      <div className="max-h-64 overflow-y-auto rounded-lg border divide-y">
                        {colleges.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCollege(c);
                              setCollegeSearch('');
                              setColleges([]);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-accent transition-colors"
                          >
                            <p className="font-medium text-sm text-foreground">{c.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {[c.shortName, c.city, c.state].filter(Boolean).join(' · ')}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                    {collegeSearch.length >= 2 && !searchingColleges && colleges.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No colleges found. Try a different search term.
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Step 3: Mobile */}
            {stepKey === 'mobile' && (
              <div className="space-y-4">
                <CountryPhoneInput
                  value={phoneValue}
                  onChange={setPhoneValue}
                />
                <p className="text-xs text-muted-foreground">
                  Your number is saved privately and will not be shown publicly.
                </p>
              </div>
            )}

            {/* Step 4: DOB */}
            {stepKey === 'dob' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    max={maxDobStr}
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">You must be at least 13 years old to use CampusLink</p>
                </div>
              </div>
            )}

            {/* Step 5: Avatar */}
            {stepKey === 'avatar' && (
              <div className="space-y-4">
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setAvatarType('preset')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      avatarType === 'preset'
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    Preset Avatars
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarType('upload')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      avatarType === 'upload'
                        ? 'bg-violet-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    Upload Photo
                  </button>
                </div>

                {avatarType === 'preset' ? (
                  <div className="grid grid-cols-5 gap-3">
                    {PRESET_AVATARS.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setPresetAvatarId(id)}
                        className={`aspect-square rounded-full flex items-center justify-center text-white text-lg font-bold transition-all ${
                          AVATAR_COLORS[(id - 1) % AVATAR_COLORS.length]
                        } ${
                          presetAvatarId === id
                            ? 'ring-4 ring-violet-500 ring-offset-2 scale-110'
                            : 'hover:scale-105'
                        }`}
                      >
                        {String.fromCodePoint(0x1f600 + id - 1)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-violet-400 transition-colors">
                      <Palette className="mx-auto text-muted-foreground mb-3" size={32} />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload coming soon! Choose a preset avatar for now.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAvatarType('preset')}
                      >
                        Pick a Preset
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-8 pt-4 border-t">
              <div>
                {currentStep > 0 && (
                  <Button type="button" variant="ghost" onClick={handleBack}>
                    <ArrowLeft size={16} className="mr-1" /> Back
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isSkippable && currentStep < STEPS.length - 1 && (
                  <Button type="button" variant="ghost" onClick={handleSkip}>
                    Skip
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={loading || (stepKey === 'name' && !canProceed())}
                  className="bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                >
                  {loading && <Loader2 className="animate-spin mr-2" size={18} />}
                  {currentStep === STEPS.length - 1 ? (
                    <>Finish <Check size={16} className="ml-1" /></>
                  ) : (
                    <>Next <ArrowRight size={16} className="ml-1" /></>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step count */}
        <p className="text-center text-sm text-muted-foreground mt-4">
          Step {currentStep + 1} of {STEPS.length}
        </p>
      </div>
    </div>
  );
}
