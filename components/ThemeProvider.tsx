'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { ThemeColor } from '@/types/user';
import { resolveThemePreferences } from '@/lib/theme';

const COLOR_CLASSES: ThemeColor[] = ['forest', 'rose', 'ocean', 'sunset'];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { userData } = useAuth();
  const { color, mode } = resolveThemePreferences(userData?.preferences);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  // Apply color class + initial dark/light state
  useEffect(() => {
    const root = document.documentElement;

    COLOR_CLASSES.forEach(c => root.classList.remove(c));
    if (color !== 'rouge') {
      root.classList.add(color);
    }

    if (mode === 'auto') {
      root.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches);
    } else {
      root.classList.toggle('dark', mode === 'dark');
    }
  }, [color, mode]);

  // Persistent matchMedia listener — mounted once, reads mode via ref
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (modeRef.current === 'auto') {
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return <>{children}</>;
}
