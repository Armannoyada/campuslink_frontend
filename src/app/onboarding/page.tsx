'use client';

import { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  Search,
  User,
  Building2,
  Phone,
  Calendar,
  Palette,
  CheckCircle2,
  XCircle,
  Sparkles,
  Camera
} from 'lucide-react';
import { CountryPhoneInput } from '@/components/user/CountryPhoneInput';
import { userApi } from '@/lib/user-api';
import { useUserAuthStore } from '@/store/user-auth.store';
import { motion, AnimatePresence } from 'framer-motion';

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

// "GenZ" Avatar Pack - Modern abstract gradients
const PRESET_AVATARS = [
  'bg-linear-to-tr from-pink-500 to-rose-400',
  'bg-linear-to-tr from-violet-600 to-indigo-500',
  'bg-linear-to-tr from-cyan-400 to-blue-500',
  'bg-linear-to-tr from-amber-400 to-orange-500',
  'bg-linear-to-tr from-emerald-400 to-teal-500',
  'bg-linear-to-bl from-fuchsia-600 to-pink-500',
  'bg-linear-to-br from-blue-600 to-violet-600',
  'bg-linear-to-r from-yellow-400 to-orange-500',
  'bg-linear-to-tr from-lime-400 to-emerald-500',
  'bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-purple-600 via-pink-500 to-red-500',
  'bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-700 via-indigo-600 to-violet-800',
  'bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500'
];

// Fun emojis for avatars
const EMOJIS = ['🚀', '✨', '🔥', '💀', '👽', '👾', '👻', '🤠', '😎', '👑', '🌈', '⚡️'];

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

  // Navigation state for animations
  const [direction, setDirection] = useState(1);

  // Username check
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
    
    // Create maxDob restriction for validation independent of the render scope limit
    const thirteenYearsAgo = new Date();
    thirteenYearsAgo.setFullYear(thirteenYearsAgo.getFullYear() - 13);

    switch (step) {
      case 'name':
        return firstName.length >= 2 && username.length >= 3 && usernameStatus === 'available';
      case 'college':
        return selectedCollege !== null; 
      case 'mobile':
        return phoneValue.length > 5; 
      case 'dob':
        if (!dob) return false;
        return new Date(dob) <= thirteenYearsAgo;
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
      if (avatarType === 'preset' && presetAvatarId !== null) {
        payload.avatarType = 'preset';
        payload.presetAvatarId = presetAvatarId + 1; // Since original code uses 1-based index
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
    if (!canProceed()) return;
    if (currentStep === STEPS.length - 1) {
      handleComplete();
    } else {
      setError('');
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  }

  function handleBack() {
    setError('');
    setDirection(-1);
    setCurrentStep((s) => Math.max(0, s - 1));
  }

  function handleSkip() {
    setError('');
    setDirection(1);
    setCurrentStep((s) => s + 1);
  }

  const isSkippable = ['college', 'mobile', 'dob'].includes(STEPS[currentStep].key);
  const stepKey = STEPS[currentStep].key;

  const maxDob = new Date();
  maxDob.setFullYear(maxDob.getFullYear() - 13);
  const maxDobStr = maxDob.toISOString().split('T')[0];

  // Animation variants
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-[#0E0E11] text-white font-sans flex flex-col items-center py-6 sm:py-10 px-4 sm:px-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 dark:bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 dark:bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[440px] z-10">
        
        {/* Dynamic Header */}
        <div className="text-center mb-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center p-2.5 bg-indigo-500/10 rounded-2xl mb-4 border border-indigo-500/20 shadow-xs border border-indigo-100 dark:border-indigo-500/20"
          >
            <Sparkles className="text-indigo-600 dark:text-indigo-400" size={32} />
          </motion.div>
          <motion.h1 
            key={`h1-${stepKey}`}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-[28px] md:text-[36px] font-bold tracking-tight text-white"
          >
            {stepKey === 'name' && 'What should we call you?'}
            {stepKey === 'college' && 'Find your campus'}
            {stepKey === 'mobile' && 'Secure your account'}
            {stepKey === 'dob' && 'When is your birthday?'}
            {stepKey === 'avatar' && 'Pick your vibe'}
          </motion.h1>
          <motion.p 
            key={`p-${stepKey}`}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-[15px] text-slate-400 mt-2"
          >
            {stepKey === 'name' && 'Set your real name and grab a unique handle.'}
            {stepKey === 'college' && 'Connect with your peers and local events.'}
            {stepKey === 'mobile' && 'Add your number for recovery (kept private).'}
            {stepKey === 'dob' && 'Just to make sure we show appropriate content.'}
            {stepKey === 'avatar' && 'Express yourself with a unique avatar.'}
          </motion.p>
        </div>



        {/* Main Content Area */}
        <div className="w-full relative px-2 sm:px-0">
          
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={stepKey}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="w-full"
            >
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                  <XCircle size={18} /> {error}
                </div>
              )}

              {/* Step 1: Name & Username */}
              {stepKey === 'name' && (
                <div className="space-y-4 sm:space-y-5">
                  <div className="space-y-4 sm:space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-[15px] font-medium text-slate-300 mb-2">First Name *</Label>
                      <Input
                        id="firstName"
                        placeholder="e.g. Alex"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="h-[52px] bg-transparent border-white/10 rounded-[14px] px-4 text-[15px] border placeholder-slate-500 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:ring-indigo-500"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-[15px] font-medium text-slate-300 mb-2">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="e.g. Smith"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="h-[52px] bg-transparent border-white/10 rounded-[14px] px-4 text-[15px] border placeholder-slate-500 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label htmlFor="username" className="text-[15px] font-medium text-slate-300 mb-2">Choose Handle *</Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                        <span className="font-semibold text-[15px]">@</span>
                      </div>
                      <Input
                        id="username"
                        placeholder="your_handle"
                        value={username}
                        onChange={(e) =>
                          setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                        }
                        className="h-[52px] pl-10 bg-transparent border-white/10 rounded-[14px] text-[15px] border placeholder-slate-500 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:ring-indigo-500"
                        maxLength={30}
                      />
                      {usernameStatus === 'checking' && (
                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-indigo-500" size={20} />
                      )}
                      {usernameStatus === 'available' && (
                        <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" size={20} />
                      )}
                      {usernameStatus === 'taken' && (
                        <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500" size={20} />
                      )}
                    </div>
                    
                    {usernameStatus === 'taken' ? (
                      <div className="flex flex-wrap items-center gap-2 mt-3 p-3 bg-rose-50 dark:bg-rose-500/10 rounded-lg">
                        <span className="text-sm font-medium text-rose-600 dark:text-rose-400">Unavailable. Try:</span>
                        {usernameSuggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setUsername(s)}
                            className="bg-white dark:bg-black px-3 py-1.5 rounded-md shadow-sm border border-rose-100 dark:border-rose-500/20 text-sm font-medium hover:text-indigo-600 transition"
                          >
                            @{s}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-400 mt-2">
                        Only lowercase letters, numbers, and underscores.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: College */}
              {stepKey === 'college' && (
                <div className="space-y-4 sm:space-y-5">
                  {selectedCollege ? (
                    <div className="p-6 rounded-2xl border border-white/10 bg-transparent flex flex-col sm:flex-row gap-4 sm:gap-0 sm:items-center justify-between">
                      <div className="flex gap-4 items-center">
                        <div className="h-12 w-12 shrink-0 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                          <Building2 size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-[16px] text-white leading-tight mb-1">{selectedCollege.name}</p>
                          <p className="text-[14px] text-slate-400">
                            {[selectedCollege.shortName, selectedCollege.city, selectedCollege.state].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSelectedCollege(null);
                          setCollegeSearch('');
                        }}
                        className="text-indigo-400 hover:text-white hover:bg-white/5 rounded-xl sm:ml-4 w-full sm:w-auto"
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <Input
                          placeholder="Search for your university..."
                          value={collegeSearch}
                          onChange={(e) => setCollegeSearch(e.target.value)}
                          className="h-[52px] pl-12 bg-transparent border-white/10 rounded-[14px] text-[15px] border placeholder-slate-500 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:ring-indigo-500"
                          autoFocus
                        />
                        {searchingColleges && (
                          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-indigo-500" size={20} />
                        )}
                      </div>
                      
                      {colleges.length > 0 && (
                        <div className="max-h-72 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/80 divide-y divide-zinc-800 shadow-inner w-full">
                          {colleges.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedCollege(c);
                                setCollegeSearch('');
                                setColleges([]);
                              }}
                              className="w-full text-left px-5 py-4 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors group overflow-hidden"
                            >
                              <p className="font-semibold text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{c.name}</p>
                              <p className="text-sm text-zinc-400 mt-1 truncate">
                                {[c.shortName, c.city, c.state].filter(Boolean).join(' · ')}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {collegeSearch.length >= 2 && !searchingColleges && colleges.length === 0 && (
                        <div className="p-8 text-center bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800">
                          <p className="text-zinc-400">
                            No colleges found. Try a different variation of the name.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Mobile */}
              {stepKey === 'mobile' && (
                <div className="space-y-4 sm:space-y-5">
                  <div className="bg-transparent rounded-2xl border border-white/10 p-1">
                    <CountryPhoneInput
                      value={phoneValue}
                      onChange={setPhoneValue}
                    />
                  </div>
                  <div className="flex items-start gap-3 p-5 bg-transparent border border-white/5 rounded-2xl">
                    <Phone className="text-slate-400 shrink-0 mt-0.5" size={20} />
                    <p className="text-[14px] text-slate-400 leading-relaxed font-medium">
                      Your number is kept completely private. We only use it for account recovery and important security alerts.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: DOB */}
              {stepKey === 'dob' && (
                <div className="space-y-4 sm:space-y-5">
                  <div className="space-y-3">
                    <Label htmlFor="dob" className="text-[15px] font-medium text-slate-300 mb-2">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      max={maxDobStr}
                      className="h-[52px] bg-transparent border-white/10 rounded-[14px] px-4 text-[15px] border placeholder-slate-500 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:ring-indigo-500 [color-scheme:light] dark:[color-scheme:dark]"
                      autoFocus
                    />
                  </div>
                  <div className="flex items-center justify-center p-6 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
                    <p className="text-sm text-zinc-400 font-medium">✨ Must be at least 13 years old to join</p>
                  </div>
                </div>
              )}

              {/* Step 5: Avatar */}
              {stepKey === 'avatar' && (
                <div className="space-y-4 sm:space-y-5">
                  <div className="flex p-1 bg-zinc-900/50 rounded-xl mb-6">
                    <button
                      type="button"
                      onClick={() => setAvatarType('preset')}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all ${
                        avatarType === 'preset'
                          ? 'bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-slate-500 hover:text-zinc-700 dark:text-slate-500 dark:hover:text-white'
                      }`}
                    >
                      GenZ Pack
                    </button>
                    <button
                      type="button"
                      onClick={() => setAvatarType('upload')}
                      className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                        avatarType === 'upload'
                          ? 'bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                          : 'text-slate-500 hover:text-zinc-700 dark:text-slate-500 dark:hover:text-white'
                      }`}
                    >
                      <Camera size={16} /> Custom Photo
                    </button>
                  </div>

                  {avatarType === 'preset' ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                      {PRESET_AVATARS.map((bgGradient, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setPresetAvatarId(index)}
                          className={`aspect-square rounded-2xl flex items-center justify-center text-4xl shadow-sm transition-all duration-300 ${bgGradient} ${
                            presetAvatarId === index
                              ? 'ring-4 ring-indigo-500 ring-offset-4 dark:ring-offset-black scale-105 z-10 shadow-indigo-500/50'
                              : 'hover:scale-105 hover:-rotate-3'
                          }`}
                        >
                          {EMOJIS[index]}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="aspect-video border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-3xl flex flex-col items-center justify-center bg-zinc-900/30 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors cursor-pointer group">
                      <div className="h-16 w-16 bg-zinc-900 rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                        <Camera className="text-slate-500 dark:text-slate-500 group-hover:text-indigo-500 transition-colors" size={28} />
                      </div>
                      <p className="text-zinc-600 dark:text-zinc-300 font-medium">Click to upload photo</p>
                      <p className="text-sm text-slate-500 mt-2">JPG, PNG or WEBP (Max 5MB)</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating Action Bar */}
        <div className="mt-8 pt-4 w-full px-2 sm:px-0">
          <Button
            onClick={handleNext}
            disabled={loading || !canProceed()}
            className="w-full h-[52px] rounded-[14px] bg-[#5E43F3] hover:bg-[#4d35d9] text-white font-semibold text-[16px] shadow-sm transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center"
          >
            {loading && <Loader2 className="animate-spin mr-2" size={20} />}
            {currentStep === STEPS.length - 1 ? (
              <>Let's Go! <Sparkles size={18} className="ml-2" /></>
            ) : (
              <>Continue <ArrowRight size={18} className="ml-2" /></>
            )}
          </Button>

          <div className="flex items-center justify-between mt-6 px-1">
            {currentStep > 0 ? (
              <button 
                onClick={handleBack}
                className="text-[14px] font-medium text-slate-400 hover:text-white transition-colors flex items-center"
              >
                <ArrowLeft size={16} className="mr-1.5" /> Back
              </button>
            ) : <div />}
            
            {isSkippable && currentStep < STEPS.length - 1 && (
              <button 
                onClick={handleSkip}
                className="text-[14px] font-medium text-slate-400 hover:text-white transition-colors"
              >
                Skip for now
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
