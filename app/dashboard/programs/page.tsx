'use client';

import { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import { useDashboardData } from '@/lib/hooks/useFirestoreData';
import { getStrengthLevel } from '@/lib/calculations/standards';
import { generateProgram, formatWeekSummary, formatSetDisplay } from '@/lib/training/programGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WeekPrescription, DayPrescription } from '@/lib/training/types';
import { Experience } from '@/types/user';
import { Dumbbell, Calendar, ChevronRight, ChevronDown, CheckCircle, Zap, Play, Wrench, Target, SkipForward, RotateCcw, Lock, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { updateUserProfile } from '@/lib/firebase/firestore';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ProgramsPage() {
  const { user, userData, refreshUserData } = useAuth();
  const router = useRouter();
  const { truePRs, loading: prsLoading } = useDashboardData(user?.uid);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [skipping, setSkipping] = useState(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [restartWeek, setRestartWeek] = useState(1);
  const [restartDay, setRestartDay] = useState(1);
  const [restarting, setRestarting] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(false);
  const [showWeekBypassDialog, setShowWeekBypassDialog] = useState(false);
  const [bypassTargetWeekIndex, setBypassTargetWeekIndex] = useState<number | null>(null);
  const [bypassedWeeks, setBypassedWeeks] = useState<Set<number>>(new Set());

  const bodyweight = userData?.bodyweight || 80;
  const gender = userData?.gender || 'male';
  const experience = userData?.experience || 'intermediate';

  // Use same PRs as dashboard - no fallback values
  const squatMax = truePRs.squat?.weight || 0;
  const benchMax = truePRs.bench?.weight || 0;
  const deadliftMax = truePRs.deadlift?.weight || 0;

  const hasPRs = squatMax > 0 && benchMax > 0 && deadliftMax > 0;

  const strengthLevel = hasPRs ? getStrengthLevel('squat', squatMax, bodyweight, gender) : 'intermediate';

  const programSettings = userData?.programSettings || { daysPerWeek: 3 as const, durationWeeks: 4 as const, priorityLift: 'squat' as const };

  const recommendation = hasPRs && userData
    ? generateProgram({
        experience: experience as Experience,
        bodyweight,
        currentMaxes: { squat: squatMax, bench: benchMax, deadlift: deadliftMax },
        weeklyAvailability: programSettings.daysPerWeek,
        daysPerWeek: programSettings.daysPerWeek,
        durationWeeks: programSettings.durationWeeks,
        priorityLift: programSettings.priorityLift,
        trainingMaxPercentage: programSettings.trainingMaxPercentage,
        programType: programSettings.programType,
      })
    : null;

  const progress = userData?.programProgress || { currentWeek: 1, currentDay: 1 };
  const currentWeekIndex = Math.min(progress.currentWeek - 1, (recommendation?.program.weeks.length || 1) - 1);
  const currentDayIndex = Math.min(progress.currentDay - 1, (recommendation?.program.weeks[currentWeekIndex]?.days.length || 1) - 1);
  const currentWeekData = recommendation?.program.weeks[currentWeekIndex];
  const currentDayData = currentWeekData?.days[currentDayIndex];

  const loading = prsLoading;

  // Initialize weekStartDates for current week if not set
  useEffect(() => {
    if (!user || !userData?.programProgress) return;
    const prog = userData.programProgress;
    if (!prog.weekStartDates?.[prog.currentWeek]) {
      updateUserProfile(user.uid, {
        programProgress: {
          ...prog,
          weekStartDates: {
            ...(prog.weekStartDates || {}),
            [prog.currentWeek]: Timestamp.now(),
          },
        },
      }).then(() => refreshUserData());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, userData?.programProgress?.currentWeek]);

  // Returns true if weekIndex (0-based) is locked (previous week started < 7 days ago)
  const isWeekLocked = (weekIndex: number): boolean => {
    if (weekIndex === 0) return false; // Week 1 is never locked
    if (weekIndex <= currentWeekIndex) return false; // Already reached this week
    const prevWeekNumber = weekIndex; // weekIndex is 0-based, so week N-1 = weekIndex (1-based)
    const weekStartDates = progress.weekStartDates;
    // If previous week has no recorded start date, it hasn't been reached yet → locked
    if (!weekStartDates?.[prevWeekNumber]) return true;
    const prevWeekStart = weekStartDates[prevWeekNumber].toDate();
    const now = new Date();
    const daysSinceStart = (now.getTime() - prevWeekStart.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceStart < 7;
  };

  // Returns number of remaining days before week unlocks (null if prev week not started yet)
  const getDaysUntilUnlock = (weekIndex: number): number | null => {
    const prevWeekNumber = weekIndex;
    const weekStartDates = progress.weekStartDates;
    if (!weekStartDates?.[prevWeekNumber]) return null;
    const prevWeekStart = weekStartDates[prevWeekNumber].toDate();
    const now = new Date();
    const daysSinceStart = (now.getTime() - prevWeekStart.getTime()) / (1000 * 60 * 60 * 24);
    return Math.ceil(7 - daysSinceStart);
  };

  const handleLaunchWorkout = (day: DayPrescription, weekNumber: number, dayNumber: number) => {
    const totalWeeks = recommendation?.program.weeks.length || 1;
    const daysPerWeek = recommendation?.program.weeks[0]?.days.length || 3;
    sessionStorage.setItem('pendingWorkoutPreset', JSON.stringify(day));
    router.push(`/dashboard/workouts/new?preset=session&week=${weekNumber}&day=${dayNumber}&totalWeeks=${totalWeeks}&daysPerWeek=${daysPerWeek}`);
  };

  const handleSkipDay = async () => {
    if (!user || !recommendation) return;

    setSkipping(true);
    try {
      const totalWeeks = recommendation.program.weeks.length;
      const daysPerWeek = recommendation.program.weeks[0]?.days.length || 3;

      let nextDay = progress.currentDay + 1;
      let nextWeek = progress.currentWeek;

      if (nextDay > daysPerWeek) {
        nextDay = 1;
        nextWeek = progress.currentWeek + 1;
        if (nextWeek > totalWeeks) {
          nextWeek = 1;
        }
      }

      const weekStartDates = { ...(progress.weekStartDates || {}) };
      if (nextWeek !== progress.currentWeek) {
        weekStartDates[nextWeek] = Timestamp.now();
      }

      await updateUserProfile(user.uid, {
        programProgress: {
          currentWeek: nextWeek,
          currentDay: nextDay,
          weekStartDates,
        }
      });
      await refreshUserData();
    } finally {
      setSkipping(false);
    }
  };

  const handleRestartCycle = async () => {
    if (!user) return;

    setRestarting(true);
    try {
      const weekStartDates: { [weekNumber: number]: Timestamp } = { ...(progress.weekStartDates || {}) };
      weekStartDates[restartWeek] = Timestamp.now();
      // Clear start dates for weeks after restartWeek
      Object.keys(weekStartDates).forEach(k => {
        if (parseInt(k) > restartWeek) delete weekStartDates[parseInt(k)];
      });

      await updateUserProfile(user.uid, {
        programProgress: {
          currentWeek: restartWeek,
          currentDay: restartDay,
          weekStartDates,
        }
      });
      await refreshUserData();
      setShowRestartDialog(false);
    } finally {
      setRestarting(false);
    }
  };

  const openRestartDialog = () => {
    setRestartWeek(1);
    setRestartDay(1);
    setShowRestartDialog(true);
  };

  const handleWeekCardClick = (index: number, isSelected: boolean) => {
    const locked = isWeekLocked(index) && !bypassedWeeks.has(index);
    if (locked) {
      setBypassTargetWeekIndex(index);
      setShowWeekBypassDialog(true);
    } else {
      setSelectedWeek(isSelected ? null : index);
    }
  };

  const handleBypassConfirm = () => {
    if (bypassTargetWeekIndex !== null) {
      setBypassedWeeks((prev: Set<number>) => new Set([...prev, bypassTargetWeekIndex as number]));
      setSelectedWeek(bypassTargetWeekIndex);
    }
    setShowWeekBypassDialog(false);
  };

  const renderDayDetail = (day: DayPrescription, weekNumber: number, isCurrentDay: boolean = false) => {
    return (
      <div key={day.dayNumber} className={`rounded-lg p-3 ${isCurrentDay ? 'bg-primary/10 ring-2 ring-primary/30' : 'bg-muted/50'}`}>
        <div className="mb-2">
          <p className="font-medium text-sm mb-2">{day.name}</p>
          <div className="flex items-center gap-2">
            {isCurrentDay && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                Aujourd'hui
              </span>
            )}
            <div className="flex gap-1 ml-auto">
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs gap-1"
                onClick={() => handleLaunchWorkout(day, weekNumber, day.dayNumber)}
              >
                <Play className="h-3 w-3" />
                Lancer
              </Button>
              {isCurrentDay && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => setShowSkipConfirm(true)}
                  disabled={skipping}
                >
                  <SkipForward className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
        {day.exercises.map((exercise, exIdx) => (
          <div key={exIdx} className="mb-2">
            <div className="flex items-center gap-1.5">
              {exercise.isToolExercise && (
                <Wrench className="h-3 w-3 text-muted-foreground" />
              )}
              <p className={`text-xs font-medium ${exercise.isToolExercise ? 'text-muted-foreground' : 'text-primary'}`}>
                {exercise.name}
                {exercise.isToolExercise && ' (outil)'}
              </p>
            </div>
            {exercise.type !== 'accessory' ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {exercise.sets.map((set, setIdx) => (
                  <span
                    key={setIdx}
                    className={`text-xs px-2 py-0.5 rounded ${
                      set.amrap ? 'bg-primary/10 text-primary font-medium' : 'bg-background'
                    }`}
                  >
                    {formatSetDisplay(set)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground ml-4">{exercise.notes}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderWeekCard = (week: WeekPrescription, index: number) => {
    const isSelected = selectedWeek === index;
    const isDeload = week.isDeload;
    const isCurrentWeek = index === currentWeekIndex;
    const locked = isWeekLocked(index) && !bypassedWeeks.has(index);
    const daysLeft = locked ? getDaysUntilUnlock(index) : null;

    return (
      <Card
        key={week.weekNumber}
        className={`cursor-pointer transition-all ${
          isSelected ? 'border-primary ring-2 ring-primary/20' : ''
        } ${isDeload ? 'bg-muted/30' : ''} ${isCurrentWeek && !isSelected ? 'border-primary/50' : ''} ${locked ? 'opacity-60' : ''}`}
        onClick={() => handleWeekCardClick(index, isSelected)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <p className="font-medium text-sm">{week.name}</p>
                <p className="text-xs text-muted-foreground">{formatWeekSummary(week)}</p>
              </div>
              {isCurrentWeek && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  En cours
                </span>
              )}
            </div>
            {locked ? (
              <div className="flex items-center gap-1.5">
                {daysLeft !== null && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {daysLeft}j
                  </span>
                )}
                <Lock className="h-4 w-4 text-muted-foreground" />
              </div>
            ) : isDeload ? (
              <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-full">
                Récup
              </span>
            ) : (
              <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isSelected ? 'rotate-90' : ''}`} />
            )}
          </div>

          {isSelected && !locked && (
            <div className="mt-4 space-y-3 border-t pt-4" onClick={(e) => e.stopPropagation()}>
              <p className="text-xs text-muted-foreground">{week.focus}</p>
              {week.days.map((day) => {
                const isCurrentDay = isCurrentWeek && day.dayNumber === progress.currentDay;
                return renderDayDetail(day, week.weekNumber, isCurrentDay);
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Programme</h1>
        <p className="text-sm text-muted-foreground">
          Génération intelligente basée sur ton niveau
        </p>
      </div>

      {recommendation && currentDayData && currentWeekData && (
        <Card className="mb-6 border-primary bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-primary" />
              <span className="font-semibold">Séance du jour</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {currentWeekData.name} • Jour {progress.currentDay}
              </span>
            </div>
            <div className="bg-background rounded-lg p-3 mb-3">
              <p className="font-medium text-sm mb-2">{currentDayData.name}</p>
              <div className="text-xs text-muted-foreground space-y-1">
                {currentDayData.exercises.slice(0, 3).map((ex, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="text-primary">{ex.name}:</span>
                    <span>{ex.sets.length} séries</span>
                  </div>
                ))}
                {currentDayData.exercises.length > 3 && (
                  <div className="text-muted-foreground/70">+ {currentDayData.exercises.length - 3} exercices</div>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => handleLaunchWorkout(currentDayData, progress.currentWeek, progress.currentDay)}
              >
                <Play className="h-4 w-4 mr-2" />
                Lancer la séance
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSkipConfirm(true)}
                disabled={skipping}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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

      <Dialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redémarrer le cycle</DialogTitle>
            <DialogDescription>
              Choisis à quelle semaine et quel jour tu veux reprendre le programme.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Semaine</label>
              <div className="grid grid-cols-4 gap-2">
                {recommendation?.program.weeks.map((week, index) => (
                  <Button
                    key={week.weekNumber}
                    variant={restartWeek === week.weekNumber ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRestartWeek(week.weekNumber)}
                    className="text-xs"
                  >
                    S{week.weekNumber}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Jour</label>
              <div className="grid grid-cols-3 gap-2">
                {recommendation?.program.weeks[restartWeek - 1]?.days.map((day) => (
                  <Button
                    key={day.dayNumber}
                    variant={restartDay === day.dayNumber ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setRestartDay(day.dayNumber)}
                    className="text-xs"
                  >
                    Jour {day.dayNumber}
                  </Button>
                ))}
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                Tu reprendras à : <span className="font-medium text-foreground">Semaine {restartWeek}, Jour {restartDay}</span>
              </p>
              {recommendation?.program.weeks[restartWeek - 1]?.days[restartDay - 1] && (
                <p className="text-xs text-primary mt-1">
                  {recommendation.program.weeks[restartWeek - 1].days[restartDay - 1].name}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRestartDialog(false)} disabled={restarting}>
              Annuler
            </Button>
            <Button onClick={handleRestartCycle} disabled={restarting}>
              {restarting ? '...' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Week bypass recommendation dialog */}
      <Dialog open={showWeekBypassDialog} onOpenChange={setShowWeekBypassDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-amber-500" />
              Semaine pas encore disponible
            </DialogTitle>
            <DialogDescription>
              {bypassTargetWeekIndex !== null && getDaysUntilUnlock(bypassTargetWeekIndex) !== null ? (
                <>
                  Cette semaine sera disponible dans{' '}
                  <span className="font-semibold text-foreground">
                    {getDaysUntilUnlock(bypassTargetWeekIndex)} jour(s)
                  </span>
                  .{' '}
                </>
              ) : (
                <>Cette semaine n&apos;est pas encore accessible. </>
              )}
              Respecter les délais entre les semaines permet une récupération optimale et de meilleures progressions.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Pourquoi attendre ?
              </p>
              <ul className="text-xs text-amber-700/80 dark:text-amber-400/80 space-y-1 list-disc list-inside">
                <li>Ton corps a besoin de 7 jours pour s'adapter aux charges</li>
                <li>Avancer trop vite augmente le risque de blessure</li>
                <li>La progression à long terme sera meilleure en respectant le rythme</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowWeekBypassDialog(false)}
              className="flex-1"
            >
              Attendre (recommandé)
            </Button>
            <Button
              variant="destructive"
              onClick={handleBypassConfirm}
              className="flex-1"
            >
              Accéder quand même
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {recommendation && (
        <>
          <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader
              className="pb-2 cursor-pointer"
              onClick={() => setShowRecommendation(!showRecommendation)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Recommandation</CardTitle>
                </div>
                {showRecommendation ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            {showRecommendation && (
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{recommendation.program.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {recommendation.program.duration} semaines • {programSettings.daysPerWeek} séances/semaine
                    </p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  {recommendation.program.description}
                </p>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-background rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Squat 1RM</p>
                    <p className="font-bold text-primary">{recommendation.program.maxes.squat} kg</p>
                  </div>
                  <div className="bg-background rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Bench 1RM</p>
                    <p className="font-bold text-primary">{recommendation.program.maxes.bench} kg</p>
                  </div>
                  <div className="bg-background rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Deadlift 1RM</p>
                    <p className="font-bold text-primary">{recommendation.program.maxes.deadlift} kg</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-primary">Points clés du programme</p>
                  {recommendation.reasoning.slice(0, 4).map((reason, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground">{reason}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-background rounded-lg">
                  <p className="text-xs font-medium mb-2">Progression attendue par cycle :</p>
                  <div className="flex gap-4 text-xs">
                    <span>Squat: <span className="text-green-500">+{recommendation.expectedProgress.squat}kg</span></span>
                    <span>Bench: <span className="text-green-500">+{recommendation.expectedProgress.bench}kg</span></span>
                    <span>Deadlift: <span className="text-green-500">+{recommendation.expectedProgress.deadlift}kg</span></span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Aperçu du cycle</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openRestartDialog}
                  className="h-8 text-xs gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Redémarrer
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                Clique sur une semaine pour voir le détail et lancer une séance
              </p>
              <div className="space-y-2">
                {recommendation.program.weeks.map((week, index) => renderWeekCard(week, index))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!recommendation && (
        <Card>
          <CardContent className="p-8 text-center">
            <Dumbbell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {!hasPRs
                ? 'Enregistre tes PRs (Squat, Bench et Deadlift) pour générer un programme personnalisé.'
                : 'Enregistre quelques lifts pour que je puisse te générer un programme personnalisé.'}
            </p>
            <Link href="/dashboard/workouts/new">
              <Button className="mt-4">Enregistrer un workout</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
