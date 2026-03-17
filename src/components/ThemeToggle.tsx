'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="w-10 h-10 rounded-full bg-white/5 border border-white/10 opacity-0"
      >
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-10 h-10 rounded-full bg-slate-200/50 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 transition-all text-slate-700 dark:text-slate-300 dark:hover:text-white"
    >
      {theme === 'dark' ? (
        <Sun size={18} className="animate-in fade-in zoom-in spin-in-90 duration-300" />
      ) : (
        <Moon size={18} className="animate-in fade-in zoom-in spin-in-90 duration-300" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
