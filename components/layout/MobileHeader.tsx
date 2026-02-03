'use client';

import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { Dumbbell } from 'lucide-react';

export function MobileHeader() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky top-0 z-50">
      <Link href="/dashboard" className="flex items-center gap-2 font-bold">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <Dumbbell className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg">NextPR</span>
      </Link>

      <Link
        href="/dashboard/profile"
        className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
      >
        {user.displayName?.charAt(0).toUpperCase() || 'U'}
      </Link>
    </header>
  );
}
