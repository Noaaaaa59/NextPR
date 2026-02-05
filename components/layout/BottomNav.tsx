'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Dumbbell, BarChart3, Users, Calculator } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Accueil', icon: Home },
  { href: '/dashboard/workouts', label: 'Workouts', icon: Dumbbell },
  { href: '/dashboard/tools', label: 'Outils', icon: Calculator },
  { href: '/dashboard/analytics', label: 'Stats', icon: BarChart3 },
  { href: '/dashboard/leaderboard', label: 'Top', icon: Users },
];

export function BottomNav() {
  const pathname = usePathname();

  // Normaliser le pathname (enlever le trailing slash pour la comparaison)
  const normalizedPathname = pathname?.endsWith('/') ? pathname.slice(0, -1) : pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t-2 border-border z-50 md:hidden shadow-lg overflow-visible">
      <div className="flex justify-around items-center h-16 px-2 overflow-visible">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = normalizedPathname === item.href ||
            (item.href !== '/dashboard' && normalizedPathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all relative rounded-lg',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground active:scale-95'
              )}
            >
              {isActive && (
                <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full shadow-[0_0_12px_rgba(220,38,38,0.6)]"></div>
              )}
              <div className={cn(
                "flex flex-col items-center justify-center transition-all",
                isActive && "scale-110"
              )}>
                <Icon className={cn(
                  "h-5 w-5 transition-all",
                  isActive && "stroke-[2.5]"
                )} />
                <span className={cn(
                  "text-xs font-medium transition-all",
                  isActive && "font-semibold"
                )}>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
