'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useDashboardData, useWorkouts, useDraftWorkout } from '@/lib/hooks/useFirestoreData';
import { Card, CardContent } from '@/components/ui/card';
import { formatWeight } from '@/lib/utils';
import { Calendar, Dumbbell, Trophy, ChevronDown, ChevronUp, Play, SkipForward, PlayCircle, Award, Hash, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SquatIcon, BenchIcon, DeadliftIcon } from '@/components/icons/LiftIcons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { generateProgram } from '@/lib/training/programGenerator';
import { getStandardWeight, getAllStandards, calculateWilksScore } from '@/lib/calculations/standards';
import { levelColors as chartLevelColors, levelLabels as chartLevelLabels } from '@/components/charts/StrengthStandardsChart';
import { DayPrescription } from '@/lib/training/types';
import { Experience } from '@/types/user';
import { updateUserProfile } from '@/lib/firebase/firestore';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { StrengthLevel } from '@/types/analytics';

// Text color variant derived from chart bar colors (bg-X -> text-X)
const LEVEL_TEXT_COLORS: Record<StrengthLevel, string> = {
  untrained: 'text-gray-400',
  novice: 'text-green-500',
  intermediate: 'text-blue-500',
  advanced: 'text-purple-500',
  elite: 'text-amber-500',
  international: 'text-red-600',
};

const LEVEL_ORDER: StrengthLevel[] = ['untrained', 'novice', 'intermediate', 'advanced', 'elite', 'international'];

// Matches the visual segments from StrengthStandardsChart:
// segment "advanced" (purple) covers [standards.intermediate, standards.advanced)
// So at 105kg bench (74kg cat), you're in the purple zone visually.
function getChartVisualLevel(
  exercise: 'squat' | 'bench' | 'deadlift',
  weight: number,
  bodyweight: number,
  gender: 'male' | 'female'
): { currentLevel: StrengthLevel; nextLevel: StrengthLevel | null; progress: number; nextWeight: number } {
  const standards = getAllStandards(exercise, bodyweight, gender);

  // Chart segments: level X covers [standards[prev], standards[X])
  // Find which segment the weight falls in (top-down)
  for (let i = LEVEL_ORDER.length - 1; i >= 0; i--) {
    const segStart = i === 0 ? 0 : standards[LEVEL_ORDER[i - 1]];
    if (weight >= segStart) {
      const level = LEVEL_ORDER[i];
      const segEnd = standards[level];

      if (i >= LEVEL_ORDER.length - 1 || weight >= standards[LEVEL_ORDER[LEVEL_ORDER.length - 1]]) {
        return { currentLevel: 'international', nextLevel: null, progress: 100, nextWeight: 0 };
      }

      const range = segEnd - segStart;
      const progress = range > 0 ? Math.min(100, Math.round(((weight - segStart) / range) * 100)) : 100;
      const nextLevel = i < LEVEL_ORDER.length - 1 ? LEVEL_ORDER[i + 1] : null;

      return { currentLevel: level, nextLevel, progress, nextWeight: segEnd };
    }
  }

  return { currentLevel: 'untrained', nextLevel: 'novice', progress: 0, nextWeight: standards.novice };
}

export default function DashboardPage() {
  const { user, userData, refreshUserData } = useAuth();
  const router = useRouter();
  const { truePRs, estimated1RMs, bestSession, loading } = useDashboardData(user?.uid);
  const { workouts, isLoading: workoutsLoading } = useWorkouts(user?.uid);
  const { draft: draftWorkout } = useDraftWorkout(user?.uid);
  const [showWorkoutDetails, setShowWorkoutDetails] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [statInfo, setStatInfo] = useState<{ title: string; description: string } | null>(null);

  const weightUnit = userData?.preferences?.weightUnit || 'kg';
  const bodyweight = userData?.bodyweight || 80;
  const gender = userData?.gender || 'male';
  const experience = userData?.experience || 'intermediate';

  const squatMax = truePRs.squat?.weight || 0;
  const benchMax = truePRs.bench?.weight || 0;
  const deadliftMax = truePRs.deadlift?.weight || 0;
  const totalAbsolu = squatMax + benchMax + deadliftMax;

  const lastWorkout = workouts[0];
  const totalWorkouts = workouts.length;

  const hasPRs = squatMax > 0 && benchMax > 0 && deadliftMax > 0;
  const overallLevel = hasPRs ? getChartVisualLevel('squat', squatMax, bodyweight, gender).currentLevel : null;
  const wilksScore = hasPRs ? calculateWilksScore(totalAbsolu, bodyweight, gender === 'male') : 0;

  const programSettings = userData?.programSettings || { daysPerWeek: 3 as const, durationWeeks: 4 as const, priorityLift: 'squat' as const };

  const program = (hasPRs && userData)
    ? generateProgram({
        experience: experience as Experience,
        bodyweight,
        currentMaxes: { squat: squatMax, bench: benchMax, deadlift: deadliftMax },
        weeklyAvailability: programSettings.daysPerWeek,
        daysPerWeek: programSettings.daysPerWeek,
        durationWeeks: programSettings.durationWeeks,
        priorityLift: programSettings.priorityLift,
        trainingMaxPercentage: programSettings.trainingMaxPercentage,
      })
    : null;

  const progress = userData?.programProgress || { currentWeek: 1, currentDay: 1 };
  const currentWeekIndex = Math.min(progress.currentWeek - 1, (program?.program.weeks.length || 1) - 1);
  const currentDayIndex = Math.min(progress.currentDay - 1, (program?.program.weeks[currentWeekIndex]?.days.length || 1) - 1);

  const currentWeek = program?.program.weeks[currentWeekIndex];
  const nextDay = currentWeek?.days[currentDayIndex];

  const handleLaunchWorkout = (day: DayPrescription, weekNum: number, dayNum: number) => {
    const totalWeeks = program?.program.weeks.length || 1;
    const daysPerWeek = currentWeek?.days.length || 3;
    sessionStorage.setItem('pendingWorkoutPreset', JSON.stringify(day));
    router.push(`/dashboard/workouts/new?preset=session&week=${weekNum}&day=${dayNum}&totalWeeks=${totalWeeks}&daysPerWeek=${daysPerWeek}`);
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

  const renderPRCell = (
    exercise: 'squat' | 'bench' | 'deadlift',
    title: string,
    Icon: React.ComponentType<{ className?: string }>
  ) => {
    const pr = truePRs[exercise];
    const estimated = estimated1RMs[exercise];
    const weight = pr?.weight || 0;

    const progressData = weight > 0
      ? getChartVisualLevel(exercise, weight, bodyweight, gender)
      : null;

    return (
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
        </div>

        {loading ? (
          <p className="text-xl font-bold text-primary">...</p>
        ) : pr ? (
          <>
            <p className="text-xl font-bold text-destructive leading-tight">
              {pr.weight} <span className="text-xs font-medium text-destructive/70">{weightUnit}</span>
            </p>
            {estimated && estimated.estimatedMax > pr.weight ? (
              <p className="text-[10px] text-primary leading-tight">~{estimated.estimatedMax} est.</p>
            ) : (
              <p className="text-[10px] leading-tight">&nbsp;</p>
            )}
          </>
        ) : (
          <p className="text-xl font-bold text-muted-foreground">—</p>
        )}

        {!loading && progressData && weight > 0 && (
          <div className="mt-2">
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${chartLevelColors[progressData.currentLevel]}`}
                style={{ width: `${progressData.progress}%` }}
              />
            </div>
            <p className={`text-[10px] font-semibold mt-1 ${LEVEL_TEXT_COLORS[progressData.currentLevel]}`}>
              {chartLevelLabels[progressData.currentLevel]}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      {/* Header compact avec badge niveau */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Salut, {userData?.displayName || 'Lifter'}!
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {overallLevel && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${chartLevelColors[overallLevel]}`} />
                  <span className={LEVEL_TEXT_COLORS[overallLevel]}>{chartLevelLabels[overallLevel]}</span>
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {totalWorkouts > 0 ? `${totalWorkouts} workout${totalWorkouts > 1 ? 's' : ''}` : 'Commence ton premier workout!'}
              </span>
            </div>
          </div>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard/workouts/new">
            <Dumbbell className="mr-2 h-4 w-4" />
            Nouveau Workout
          </Link>
        </Button>
      </div>

      {/* Draft workout banner */}
      {draftWorkout && (
        <Card className="mb-4 border-2 border-orange-500/50 bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
                  <PlayCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm">Seance en cours</p>
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

      {/* HERO: Prochaine seance */}
      {program && nextDay && currentWeek ? (
        <Card className="mb-5 border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Play className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold">Prochaine seance</p>
                <p className="text-xs text-muted-foreground">{currentWeek.name}</p>
              </div>
            </div>

            <div className="bg-background/60 rounded-xl p-4 mb-4">
              <p className="text-sm font-semibold text-primary mb-2">{nextDay.name}</p>
              <div className="space-y-1.5">
                {nextDay.exercises.map((ex, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{ex.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {ex.sets.length} x {ex.sets[0]?.reps}{ex.sets[ex.sets.length - 1]?.amrap ? '+' : ''} @ {ex.sets[ex.sets.length - 1]?.weight || '?'}{weightUnit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="lg"
                className="flex-1"
                onClick={() => handleLaunchWorkout(nextDay, progress.currentWeek, progress.currentDay)}
              >
                <Play className="h-4 w-4 mr-2" />
                Lancer la seance
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowSkipConfirm(true)}
                disabled={skipping}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-5 border border-dashed border-primary/30">
          <CardContent className="p-5 text-center">
            <Dumbbell className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm font-medium mb-1">Aucun programme actif</p>
            <p className="text-xs text-muted-foreground mb-3">
              {!hasPRs
                ? 'Enregistre tes PRs en squat, bench et deadlift pour generer un programme'
                : 'Configure ton programme dans les reglages'}
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href={hasPRs ? '/dashboard/programs' : '/dashboard/workouts/new'}>
                {hasPRs ? 'Voir programmes' : 'Commencer'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* PRs sur une seule ligne */}
      <Card className="mb-5 border">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4">
            {renderPRCell('squat', 'Squat', SquatIcon)}
            {renderPRCell('bench', 'Bench', BenchIcon)}
            {renderPRCell('deadlift', 'Deadlift', DeadliftIcon)}
          </div>
        </CardContent>
      </Card>

      {/* Stats compactes en ligne */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <button
          className="bg-muted/30 rounded-xl p-3 flex items-center gap-3 text-left active:scale-95 transition-transform"
          onClick={() => setStatInfo({
            title: 'Total',
            description: 'La somme de tes meilleurs PRs en Squat, Bench Press et Deadlift. C\'est le chiffre de référence en compétition de powerlifting pour comparer les athlètes d\'une même catégorie.',
          })}
        >
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Trophy className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold text-primary leading-tight">
              {loading ? '...' : totalAbsolu > 0 ? `${totalAbsolu}` : '—'}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
          </div>
        </button>

        <button
          className="bg-muted/30 rounded-xl p-3 flex items-center gap-3 text-left active:scale-95 transition-transform"
          onClick={() => setStatInfo({
            title: 'Best Session',
            description: 'Le total le plus élevé réalisé en une seule séance (somme des meilleurs sets de chaque mouvement dans un même workout). Ça reflète ta meilleure performance globale sur une session.',
          })}
        >
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Award className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold text-primary leading-tight">
              {loading ? '...' : bestSession ? `${bestSession.total}` : '—'}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Best Session</p>
          </div>
        </button>

        <div className="bg-muted/30 rounded-xl p-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Hash className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold text-primary leading-tight">
              {workoutsLoading ? '...' : totalWorkouts}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Workouts</p>
          </div>
        </div>

        <button
          className="bg-muted/30 rounded-xl p-3 flex items-center gap-3 text-left active:scale-95 transition-transform"
          onClick={() => setStatInfo({
            title: 'Score Wilks',
            description: 'Un score qui normalise ta force par rapport à ton poids de corps. Il permet de comparer équitablement des athlètes de catégories différentes. Plus le score est élevé, plus tu es fort relativement à ton poids.',
          })}
        >
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Scale className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-lg font-bold text-primary leading-tight">
              {loading ? '...' : wilksScore > 0 ? wilksScore.toFixed(0) : '—'}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Wilks</p>
          </div>
        </button>
      </div>

      {/* Dernier entrainement */}
      <Card className="border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Dernier entrainement</span>
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
                            {s.weight}x{s.reps}
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
                Aucun entrainement recent
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/workouts/new">Commencer</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showSkipConfirm}
        onOpenChange={setShowSkipConfirm}
        title="Passer cette seance ?"
        description="La seance sera marquee comme passee et tu passeras a la suivante. Cette action est irreversible."
        confirmLabel="Passer"
        cancelLabel="Annuler"
        onConfirm={async () => {
          await handleSkipDay();
          setShowSkipConfirm(false);
        }}
        loading={skipping}
      />

      <Dialog open={statInfo !== null} onOpenChange={(open) => { if (!open) setStatInfo(null); }}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>{statInfo?.title}</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              {statInfo?.description}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
