'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { GoogleSignIn } from '@/components/auth/GoogleSignIn';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, TrendingUp, Trophy } from 'lucide-react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background">
        <div className="flex flex-col items-center gap-4">
          <Dumbbell className="h-12 w-12 animate-pulse text-primary" />
          <p className="text-lg font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/20 to-background p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary mb-6 shadow-lg shadow-primary/30">
            <Dumbbell className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            PowerLift Pro
          </h1>
          <p className="text-lg text-muted-foreground">
            Suivez vos performances SBD
          </p>
        </div>

        <Card className="shadow-2xl border-2">
          <CardHeader className="space-y-4 text-center pb-6">
            <CardTitle className="text-2xl">Commencez votre progression</CardTitle>
            <CardDescription className="text-base">
              Connectez-vous pour tracker vos lifts et battre vos records
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <GoogleSignIn />

            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-accent mb-2">
                  <TrendingUp className="h-5 w-5 text-accent-foreground" />
                </div>
                <p className="text-xs text-muted-foreground font-medium">Progression</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-accent mb-2">
                  <Dumbbell className="h-5 w-5 text-accent-foreground" />
                </div>
                <p className="text-xs text-muted-foreground font-medium">Workouts</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-accent mb-2">
                  <Trophy className="h-5 w-5 text-accent-foreground" />
                </div>
                <p className="text-xs text-muted-foreground font-medium">Records</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
