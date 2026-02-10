'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { ThemeColor } from '@/types/user';
import { resolveThemePreferences } from '@/lib/theme';

const COLOR_CLASSES: ThemeColor[] = ['forest', 'rose', 'ocean', 'sunset'];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { userData } = useAuth();
  const { color, mode } = resolveThemePreferences(userData?.preferences);

  useEffect(() => {
    const root = document.documentElement;

    // Remove all color classes
    COLOR_CLASSES.forEach(c => root.classList.remove(c));

    // Add color class (rouge = default, no class needed)
    if (color !== 'rouge') {
      root.classList.add(color);
    }

    // Handle mode
    if (mode === 'auto') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const apply = (dark: boolean) => {
        root.classList.toggle('dark', dark);
      };
      apply(mq.matches);
      const handler = (e: MediaQueryListEvent) => apply(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      root.classList.toggle('dark', mode === 'dark');
    }
  }, [color, mode]);

  return <>{children}</>;
}
