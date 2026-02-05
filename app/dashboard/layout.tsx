'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { useAuth } from '@/components/auth/AuthProvider';
import { Navbar } from '@/components/layout/Navbar';
import { BottomNav } from '@/components/layout/BottomNav';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, userData, loading, refreshUserData } = useAuth();
  const router = useRouter();
  const { mutate } = useSWRConfig();

  const showOnboarding = !loading && !!user && userData?.onboardingCompleted !== true;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleOnboardingComplete = async () => {
    await refreshUserData();
    if (user) {
      mutate(`prs-${user.uid}`);
      mutate(`estimated-${user.uid}`);
      mutate(`best-session-${user.uid}`);
      mutate(`workouts-${user.uid}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg">Chargement...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <MobileHeader />
        <Navbar />
        <main className="pb-20 md:pb-0">{children}</main>
        <BottomNav />
        <OnboardingModal
          open={showOnboarding}
          onComplete={handleOnboardingComplete}
        />
      </div>
    </ThemeProvider>
  );
}
