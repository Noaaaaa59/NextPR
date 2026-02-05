'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Theme } from '@/types/user';

const THEME_CLASSES: Theme[] = ['light', 'dark', 'forest', 'rose', 'ocean', 'sunset'];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { userData } = useAuth();
  const theme = userData?.preferences?.theme || 'dark';

  useEffect(() => {
    const root = document.documentElement;

    THEME_CLASSES.forEach(t => {
      root.classList.remove(t);
    });

    if (theme !== 'light') {
      root.classList.add(theme);
    }
  }, [theme]);

  return <>{children}</>;
}
