'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useDashboardData, useWorkouts, useDraftWorkout } from '@/lib/hooks/useFirestoreData';
import { Card, CardContent } from '@/components/ui/card';
import { formatWeight } from '@/lib/utils';
import { Award, Calendar, Dumbbell, Trophy, ChevronDown, ChevronUp, Play, SkipForward, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SquatIcon, BenchIcon, DeadliftIcon } from '@/components/icons/LiftIcons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { generateProgram } from '@/lib/training/programGenerator';
import { getStrengthLevel } from '@/lib/calculations/standards';
import { DayPrescription } from '@/lib/training/types';
import { Experience } from '@/types/user';
import { updateUserProfile } from '@/lib/firebase/firestore';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function DashboardPage() {
  const { user, userData, refreshUserData } = useAuth();
  const router = useRouter();
  const { truePRs, estimated1RMs, bestSession, loading } = useDashboardData(user?.uid);
  const { workouts, isLoading: workoutsLoading } = useWorkouts(user?.uid);
  const { draft: draftWorkout } = useDraftWorkout(user?.uid);
  const [showWorkoutDetails, setShowWorkoutDetails] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  const weightUnit = userData?.preferences?.weightUnit || 'kg';
  const bodyweight = userData?.bodyweight || 80;
  const gender = userData?.gender || 'male';
  const experience = userData?.experience || 'intermediate';

  const squatMax = truePRs.squat?.weight || 0;
  const benchMax = truePRs.bench?.weight || 0;
  const deadliftMax = truePRs.deadlift?.weight || 0;
  const totalAbsolu = squatMax + benchMax + deadliftMax;

  const lastWorkout = workouts[0];

  const hasPRs = squatMax > 0 && benchMax > 0 && deadliftMax > 0;
  const strengthLevel = hasPRs ? getStrengthLevel('squat', squatMax, bodyweight, gender) : 'intermediate';

  const programSettings = userData?.programSettings || { daysPerWeek: 3 as const, durationWeeks: 4 as const, priorityLift: 'squat' as const };

  const program = (hasPRs && userData)
    ? generateProgram({
        experience: experience as Experience,
        strengthLevel,
        bodyweight,
        currentMaxes: { squat: squatMax, bench: benchMax, deadlift: deadliftMax },
        weeklyAvailability: programSettings.daysPerWeek,
        daysPerWeek: programSettings.daysPerWeek,
        durationWeeks: programSettings.durationWeeks,
        priorityLift: programSettings.priorityLift,
        programType: programSettings.programType,
      })
    : null;

  const progress = userData?.programProgress || { currentWeek: 1, currentDay: 1 };
  const currentWeekIndex = Math.min(progress.currentWeek - 1, (program?.program.weeks.length || 1) - 1);
  const currentDayIndex = Math.min(progress.currentDay - 1, (program?.program.weeks[currentWeekIndex]?.days.length || 1) - 1);

  const currentWeek = program?.program.weeks[currentWeekIndex];
  const nextDay = currentWeek?.days[currentDayIndex];

  const handleLaunchWorkout = (day: DayPrescription, weekNum: number, dayNum: number) => {
    const workoutData = encodeURIComponent(JSON.stringify(day));
    const totalWeeks = program?.program.weeks.length || 1;
    const daysPerWeek = currentWeek?.days.length || 3;
    router.push(`/dashboard/workouts/new?preset=${workoutData}&week=${weekNum}&day=${dayNum}&totalWeeks=${totalWeeks}&daysPerWeek=${daysPerWeek}`);
  };

  const handleSkipDay = async () => {
    if (!user || !program) return;

    setSkipping(true);
    try {
      const totalWeeks = program.program.weeks.length;
      const daysPerWeek = currentWeek?.days.length || 3;

      let nextDay = progress.currentDay + 1;
      let nextWeek = progress.currentWeek;

      if (nextDay > daysPerWeek) {
        nextDay = 1;
        nextWeek = progress.currentWeek + 1;
        if (nextWeek > totalWeeks) {
          nextWeek = 1;
        }
      }

      await updateUserProfile(user.uid, {
        programProgress: {
          currentWeek: nextWeek,
          currentDay: nextDay
        }
      });
      await refreshUserData();
    } finally {
      setSkipping(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;

    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short'
    }).format(date);
  };

  const renderPRCard = (
    exercise: 'squat' | 'bench' | 'deadlift',
    title: string,
    Icon: React.ComponentType<{ className?: string }>
  ) => {
    const pr = truePRs[exercise];
    const estimated = estimated1RMs[exercise];

    return (
      <Card className="border hover:shadow-md transition-all hover:border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
              {loading ? (
                <div className="text-2xl font-bold text-primary">...</div>
              ) : pr ? (
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-2xl font-bold text-destructive">
                    {pr.weight}
                  </span>
                  <span className="text-sm text-destructive/70">{weightUnit}</span>
                  <span className="text-xs text-muted-foreground">
                    ({pr.reps}r)
                  </span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-muted-foreground">—</div>
              )}
              {!loading && pr && estimated && estimated.estimatedMax > pr.weight && (
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-sm font-semibold text-primary">
                    {formatWeight(estimated.estimatedMax, weightUnit)}
                  </span>
                  <span className="text-xs text-primary/60">
                    estimé
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <div className="mb-6 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl -z-10"></div>
        <div className="p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            Salut, {userData?.displayName || 'Lifter'}!
          </h1>
          <p className="text-sm text-muted-foreground mb-3">
            Suivez vos performances et progressez
          </p>
          <Button asChild size="sm">
            <Link href="/dashboard/workouts/new">
              <Dumbbell className="mr-2 h-4 w-4" />
              Nouveau Workout
            </Link>
          </Button>
        </div>
      </div>

      {draftWorkout && (
        <Card className="mb-4 border-2 border-orange-500/50 bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
                  <PlayCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm">Séance en cours</p>
                  <p className="text-xs text-muted-foreground">
                    {draftWorkout.title || 'Workout'}
                  </p>
                </div>
              </div>
              <Button asChild size="sm">
                <Link href="/dashboard/workouts/new">
                  Reprendre
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {renderPRCard('squat', 'Squat', SquatIcon)}
        {renderPRCard('bench', 'Bench', BenchIcon)}
        {renderPRCard('deadlift', 'Deadlift', DeadliftIcon)}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="border bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Trophy className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Meilleure Session</p>
                <div className="text-xl font-bold text-primary">
                  {loading ? '...' : bestSession ? formatWeight(bestSession.total, weightUnit) : '—'}
                </div>
                {!loading && bestSession && (
                  <p className="text-xs text-muted-foreground truncate">
                    {bestSession.lifts.squat} / {bestSession.lifts.bench} / {bestSession.lifts.deadlift}
                  </p>
                )}
                {!loading && !bestSession && (
                  <p className="text-xs text-muted-foreground">
                    Fais S/B/D dans une même séance
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border bg-gradient-to-br from-accent/30 to-accent/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/80 flex items-center justify-center shrink-0">
                <Award className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Absolu</p>
                <div className="text-xl font-bold text-primary">
                  {loading ? '...' : totalAbsolu > 0 ? formatWeight(totalAbsolu, weightUnit) : '—'}
                </div>
                {!loading && totalAbsolu > 0 && (
                  <p className="text-xs text-muted-foreground truncate">
                    {squatMax} / {benchMax} / {deadliftMax}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Dernier entraînement</span>
            </div>
            {workoutsLoading ? (
              <p className="text-xs text-muted-foreground">Chargement...</p>
            ) : lastWorkout ? (
              <div>
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setShowWorkoutDetails(!showWorkoutDetails)}
                >
                  <div>
                    <p className="text-sm font-semibold">{formatDate(lastWorkout.date)}</p>
                    <p className="text-xs text-muted-foreground">
                      {lastWorkout.exercises.map(e => e.name.split(' ')[0]).join(' • ')}
                    </p>
                  </div>
                  {showWorkoutDetails ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {showWorkoutDetails && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    {lastWorkout.exercises.map((ex, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-medium text-primary">{ex.name}</span>
                        <div className="text-muted-foreground">
                          {ex.sets.map((s, j) => (
                            <span key={j}>
                              {j > 0 && ' • '}
                              {s.weight}×{s.reps}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                  <Link href="/dashboard/workouts">Voir historique</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-2">
                <Dumbbell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-2">
                  Aucun entraînement récent
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/workouts/new">Commencer</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Programme actif</span>
            </div>
            {program && nextDay && currentWeek ? (
              <div>
                <p className="text-sm font-semibold">{program.program.name}</p>
                <p className="text-xs text-muted-foreground mb-2">
                  {currentWeek.name}
                </p>

                <div className="bg-primary/5 rounded-lg p-2 mb-3">
                  <p className="text-xs font-medium text-primary mb-1">{nextDay.name}</p>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {nextDay.exercises.slice(0, 2).map((ex, i) => (
                      <div key={i}>
                        {ex.name}: {ex.sets.length} séries
                      </div>
                    ))}
                    {nextDay.exercises.length > 2 && (
                      <div>+ {nextDay.exercises.length - 2} accessoires</div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleLaunchWorkout(nextDay, progress.currentWeek, progress.currentDay)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Lancer
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSkipConfirm(true)}
                    disabled={skipping}
                  >
                    <SkipForward className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-2">
                <Award className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground mb-2">
                  {squatMax === 0 || benchMax === 0 || deadliftMax === 0
                    ? 'Enregistre tes PRs pour générer un programme'
                    : 'Aucun programme actif'}
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/programs">Voir programmes</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={showSkipConfirm}
        onOpenChange={setShowSkipConfirm}
        title="Passer cette séance ?"
        description="La séance sera marquée comme passée et tu passeras à la suivante. Cette action est irréversible."
        confirmLabel="Passer"
        cancelLabel="Annuler"
        onConfirm={async () => {
          await handleSkipDay();
          setShowSkipConfirm(false);
        }}
        loading={skipping}
      />
    </div>
  );
}
