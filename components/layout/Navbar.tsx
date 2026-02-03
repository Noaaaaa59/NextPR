'use client';

import Link from 'next/link';
import { useAuth } from '@/components/auth/AuthProvider';
import { signOut } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { useRouter, usePathname } from 'next/navigation';
import { Dumbbell, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  if (!user) return null;

  const navItems = [
    { href: '/dashboard', label: 'Accueil' },
    { href: '/dashboard/workouts', label: 'Workouts' },
    { href: '/dashboard/analytics', label: 'Statistiques' },
    { href: '/dashboard/leaderboard', label: 'Classement' },
  ];

  return (
    <nav className="hidden md:flex items-center justify-between px-6 py-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold hover:text-primary transition-colors">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <Dumbbell className="h-5 w-5 text-primary-foreground" />
          </div>
          PowerLift Pro
        </Link>
        <div className="flex gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-all hover:bg-accent",
                pathname === item.href
                  ? "text-primary bg-accent"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/profile"
          className="flex items-center gap-3 px-4 py-2 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
            {user.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="text-sm font-medium">{user.displayName}</span>
        </Link>
        <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </nav>
  );
}
