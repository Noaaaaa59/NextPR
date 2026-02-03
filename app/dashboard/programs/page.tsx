'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useDashboardData } from '@/lib/hooks/useFirestoreData';
import { getStrengthLevel } from '@/lib/calculations/standards';
import { generateProgram, formatWeekSummary, formatSetDisplay } from '@/lib/training/programGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgramRecommendation, WeekPrescription, DayPrescription } from '@/lib/training/types';
import { Experience } from '@/types/user';
import { Dumbbell, Calendar, ChevronRight, CheckCircle, Zap, Play, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProgramsPage() {
  const { user, userData } = useAuth();
  const router = useRouter();
  const { truePRs, loading: prsLoading } = useDashboardData(user?.uid);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  const bodyweight = userData?.bodyweight || 80;
  const gender = userData?.gender || 'male';
  const experience = userData?.experience || 'intermediate';

  // Use same PRs as dashboard - no fallback values
  const squatMax = truePRs.squat?.weight || 0;
  const benchMax = truePRs.bench?.weight || 0;
  const deadliftMax = truePRs.deadlift?.weight || 0;

  const hasPRs = squatMax > 0 && benchMax > 0 && deadliftMax > 0;

  const strengthLevel = hasPRs ? getStrengthLevel('squat', squatMax, bodyweight, gender) : 'intermediate';

  const recommendation = hasPRs && userData
    ? generateProgram({
        experience: experience as Experience,
        strengthLevel,
        bodyweight,
        currentMaxes: { squat: squatMax, bench: benchMax, deadlift: deadliftMax },
        weeklyAvailability: 3,
      })
    : null;

  const loading = prsLoading;

  const handleLaunchWorkout = (day: DayPrescription, weekNumber: number, dayNumber: number) => {
    const workoutData = encodeURIComponent(JSON.stringify(day));
    const totalWeeks = recommendation?.program.weeks.length || 1;
    const daysPerWeek = recommendation?.program.weeks[0]?.days.length || 3;
    router.push(`/dashboard/workouts/new?preset=${workoutData}&week=${weekNumber}&day=${dayNumber}&totalWeeks=${totalWeeks}&daysPerWeek=${daysPerWeek}`);
  };

  const renderDayDetail = (day: DayPrescription, weekNumber: number) => {
    return (
      <div key={day.dayNumber} className="bg-muted/50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="font-medium text-sm">{day.name}</p>
          <Button
            size="sm"
            variant="default"
            className="h-7 text-xs gap-1"
            onClick={() => handleLaunchWorkout(day, weekNumber, day.dayNumber)}
          >
            <Play className="h-3 w-3" />
            Lancer
          </Button>
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
                      set.amrap ? 'bg-destructive/10 text-destructive font-medium' : 'bg-background'
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

    return (
      <Card
        key={week.weekNumber}
        className={`cursor-pointer transition-all ${
          isSelected ? 'border-primary ring-2 ring-primary/20' : ''
        } ${isDeload ? 'bg-muted/30' : ''}`}
        onClick={() => setSelectedWeek(isSelected ? null : index)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{week.name}</p>
              <p className="text-xs text-muted-foreground">{formatWeekSummary(week)}</p>
            </div>
            {isDeload ? (
              <span className="text-xs bg-green-500/10 text-green-600 px-2 py-1 rounded-full">
                Récup
              </span>
            ) : (
              <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isSelected ? 'rotate-90' : ''}`} />
            )}
          </div>

          {isSelected && (
            <div className="mt-4 space-y-3 border-t pt-4" onClick={(e) => e.stopPropagation()}>
              <p className="text-xs text-muted-foreground">{week.focus}</p>
              {week.days.map((day) => renderDayDetail(day, week.weekNumber))}
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

      {recommendation && (
        <>
          <Card className="mb-6 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Recommandation</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">{recommendation.program.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {recommendation.program.duration} semaines • 3 séances/semaine
                  </p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">
                {recommendation.program.description}
              </p>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-background rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Squat 1RM</p>
                  <p className="font-bold text-destructive">{recommendation.program.maxes.squat} kg</p>
                </div>
                <div className="bg-background rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Bench 1RM</p>
                  <p className="font-bold text-destructive">{recommendation.program.maxes.bench} kg</p>
                </div>
                <div className="bg-background rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Deadlift 1RM</p>
                  <p className="font-bold text-destructive">{recommendation.program.maxes.deadlift} kg</p>
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
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Aperçu du cycle</CardTitle>
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
