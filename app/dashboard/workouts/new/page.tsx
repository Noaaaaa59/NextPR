'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createWorkout, createLift, updateUserProfile, saveDraftWorkout, getDraftWorkout, deleteDraftWorkout } from '@/lib/firebase/firestore';
import { calculateOneRepMax } from '@/lib/calculations/oneRepMax';
import { Timestamp } from 'firebase/firestore';
import { ArrowLeft, Plus, Trash2, Dumbbell, Wrench, Check, Loader2 } from 'lucide-react';
import { DayPrescription, ExercisePrescription, SetPrescription } from '@/lib/training/types';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

type ExerciseType = 'squat' | 'bench' | 'deadlift';

interface SetData {
  weight: number;
  reps: number;
  completed: boolean;
  target?: { weight: number; reps: number };
}

interface ExerciseData {
  type: ExerciseType;
  name: string;
  sets: SetData[];
  isToolExercise?: boolean;
}

export default function NewWorkoutPage() {
  const { user, refreshUserData } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [saving, setSaving] = useState(false);
  const [presetLoaded, setPresetLoaded] = useState(false);
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [programInfo, setProgramInfo] = useState<{ week: number; day: number; totalWeeks: number; daysPerWeek: number } | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const draftStartedAt = useRef<Timestamp | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const exerciseLabels: Record<string, string> = {
    squat: 'Squat',
    bench: 'Bench Press',
    deadlift: 'Deadlift'
  };

  const saveDraft = useCallback(async (exercisesToSave: ExerciseData[], title: string, info: typeof programInfo) => {
    if (!user || exercisesToSave.length === 0) return;

    setAutoSaving(true);
    try {
      await saveDraftWorkout(user.uid, {
        exercises: exercisesToSave,
        title: title,
        programWeek: info?.week,
        programDay: info?.day,
        totalWeeks: info?.totalWeeks,
        daysPerWeek: info?.daysPerWeek,
        startedAt: draftStartedAt.current || undefined,
      });
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setAutoSaving(false);
    }
  }, [user]);

  const scheduleDraftSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    // Save after 500ms of inactivity (reduced from 2s for better reliability)
    saveTimeoutRef.current = setTimeout(() => {
      saveDraft(exercises, workoutTitle, programInfo);
    }, 500);
  }, [saveDraft, exercises, workoutTitle, programInfo]);

  useEffect(() => {
    const initializeWorkout = async () => {
      if (!user || draftLoaded) return;

      const presetParam = searchParams.get('preset');

      if (presetParam) {
        // Starting a new workout from program - delete any existing draft
        try {
          await deleteDraftWorkout(user.uid);
        } catch (error) {
          // Ignore if no draft exists
        }
        // Reset the startedAt for the new workout
        draftStartedAt.current = null;
      } else {
        // No preset - try to load existing draft
        try {
          const draft = await getDraftWorkout(user.uid);
          if (draft) {
            setExercises(draft.exercises as ExerciseData[]);
            setWorkoutTitle(draft.title);
            draftStartedAt.current = draft.startedAt;
            if (draft.programWeek && draft.programDay) {
              setProgramInfo({
                week: draft.programWeek,
                day: draft.programDay,
                totalWeeks: draft.totalWeeks || 4,
                daysPerWeek: draft.daysPerWeek || 3,
              });
              setPresetLoaded(true);
            }
          }
        } catch (error) {
          console.error('Error loading draft:', error);
        }
      }
      setDraftLoaded(true);
    };

    initializeWorkout();
  }, [user, draftLoaded, searchParams]);

  useEffect(() => {
    if (draftLoaded && exercises.length > 0) {
      scheduleDraftSave();
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [exercises, workoutTitle, draftLoaded, scheduleDraftSave]);

  // Use ref to track latest state for event handlers
  const exercisesRef = useRef(exercises);
  const workoutTitleRef = useRef(workoutTitle);
  const programInfoRef = useRef(programInfo);

  useEffect(() => {
    exercisesRef.current = exercises;
    workoutTitleRef.current = workoutTitle;
    programInfoRef.current = programInfo;
  }, [exercises, workoutTitle, programInfo]);

  useEffect(() => {
    const saveCurrentState = () => {
      if (user && exercisesRef.current.length > 0) {
        // Clear any pending save timeout
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
        saveDraft(exercisesRef.current, workoutTitleRef.current, programInfoRef.current);
      }
    };

    // Save when page becomes hidden (more reliable than beforeunload)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveCurrentState();
      }
    };

    // Also save on beforeunload as a fallback
    const handleBeforeUnload = () => {
      saveCurrentState();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      // Save on component unmount
      saveCurrentState();
    };
  }, [user, saveDraft]);

  useEffect(() => {
    const presetParam = searchParams.get('preset');
    const weekParam = searchParams.get('week');
    const dayParam = searchParams.get('day');
    const totalWeeksParam = searchParams.get('totalWeeks');
    const daysPerWeekParam = searchParams.get('daysPerWeek');

    if (presetParam && !presetLoaded) {
      try {
        const dayData: DayPrescription = JSON.parse(decodeURIComponent(presetParam));
        setWorkoutTitle(dayData.name);

        if (weekParam && dayParam && totalWeeksParam && daysPerWeekParam) {
          setProgramInfo({
            week: parseInt(weekParam),
            day: parseInt(dayParam),
            totalWeeks: parseInt(totalWeeksParam),
            daysPerWeek: parseInt(daysPerWeekParam)
          });
        }

        const presetExercises: ExerciseData[] = dayData.exercises.map((ex: ExercisePrescription) => {
          const isMainLift = ex.type === 'squat' || ex.type === 'bench' || ex.type === 'deadlift';
          const isToolExercise = ex.isToolExercise || ex.type === 'accessory';

          return {
            type: isMainLift ? ex.type : ('accessory' as any),
            name: ex.name,
            isToolExercise,
            sets: ex.sets.map((set: SetPrescription) => ({
              weight: set.weight || 0,
              reps: 0,
              completed: false,
              target: {
                weight: set.weight || 0,
                reps: set.reps
              }
            }))
          };
        });

        setExercises(presetExercises);
        setPresetLoaded(true);
      } catch (e) {
        console.error('Error parsing preset data:', e);
      }
    }
  }, [searchParams, presetLoaded]);

  const updateSet = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: string) => {
    const newExercises = [...exercises];
    const numValue = parseFloat(value) || 0;
    newExercises[exerciseIndex].sets[setIndex][field] = numValue;
    newExercises[exerciseIndex].sets[setIndex].completed =
      newExercises[exerciseIndex].sets[setIndex].weight > 0 &&
      newExercises[exerciseIndex].sets[setIndex].reps > 0;
    setExercises(newExercises);
  };

  const toggleSetCompleted = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises];
    const set = newExercises[exerciseIndex].sets[setIndex];

    if (!set.completed && set.target) {
      set.weight = set.target.weight;
      set.reps = set.target.reps;
    }
    set.completed = !set.completed;
    setExercises(newExercises);
  };

  const addSet = (exerciseIndex: number) => {
    const newExercises = [...exercises];
    const lastSet = newExercises[exerciseIndex].sets[newExercises[exerciseIndex].sets.length - 1];
    newExercises[exerciseIndex].sets.push({
      weight: lastSet?.weight || 0,
      reps: 0,
      completed: false,
      target: lastSet?.target
    });
    setExercises(newExercises);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const newExercises = [...exercises];
    if (newExercises[exerciseIndex].sets.length > 1) {
      newExercises[exerciseIndex].sets = newExercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
      setExercises(newExercises);
    }
  };

  const addManualExercise = (type: ExerciseType) => {
    setExercises([
      ...exercises,
      {
        type,
        name: exerciseLabels[type],
        sets: [{ weight: 0, reps: 0, completed: false }]
      }
    ]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const saveWorkout = async () => {
    const mainLifts = exercises.filter(ex => !ex.isToolExercise && ex.sets.some(s => s.completed));
    if (!user || mainLifts.length === 0) return;

    setSaving(true);
    try {
      const workoutExercises = mainLifts.map(ex => ({
        name: ex.name,
        type: ex.type,
        sets: ex.sets.filter(s => s.completed)
      }));

      await createWorkout({
        userId: user.uid,
        date: Timestamp.now(),
        exercises: workoutExercises,
        completed: true,
        notes: workoutTitle || ''
      });

      for (const exercise of mainLifts) {
        const completedSets = exercise.sets.filter(set => set.completed && set.weight > 0 && set.reps > 0);
        if (completedSets.length === 0) continue;

        const bestSet = completedSets.reduce((best, current) => {
          const currentMax = calculateOneRepMax(current.weight, current.reps);
          const bestMax = calculateOneRepMax(best.weight, best.reps);
          return currentMax > bestMax ? current : best;
        });

        if (bestSet.weight > 0 && bestSet.reps > 0) {
          await createLift({
            userId: user.uid,
            exercise: exercise.type,
            weight: bestSet.weight,
            reps: bestSet.reps,
            estimatedMax: calculateOneRepMax(bestSet.weight, bestSet.reps),
            date: Timestamp.now()
          });
        }
      }

      if (programInfo) {
        let nextWeek = programInfo.week;
        let nextDay = programInfo.day + 1;

        if (nextDay > programInfo.daysPerWeek) {
          nextDay = 1;
          nextWeek = programInfo.week + 1;
          if (nextWeek > programInfo.totalWeeks) {
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
      }

      await deleteDraftWorkout(user.uid);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  const hasCompletedSets = exercises.some(ex => !ex.isToolExercise && ex.sets.some(s => s.completed));
  const hasAnyData = exercises.length > 0;

  const handleCancel = async () => {
    if (hasAnyData) {
      setShowCancelConfirm(true);
    } else {
      router.back();
    }
  };

  const confirmCancel = async () => {
    if (user) {
      try {
        await deleteDraftWorkout(user.uid);
      } catch (error) {
        console.error('Error deleting draft:', error);
      }
    }
    setShowCancelConfirm(false);
    router.push('/dashboard');
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="mb-4 hover:bg-accent"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Dumbbell className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{workoutTitle || 'Nouveau Workout'}</h1>
            <p className="text-muted-foreground text-sm">
              {presetLoaded ? 'Coche les séries au fur et à mesure' : 'Enregistre tes séries'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {exercises.map((exercise, exIndex) => (
          <Card
            key={exIndex}
            className={`border-2 ${exercise.isToolExercise ? 'bg-muted/30 border-muted' : 'border-primary/20'}`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {exercise.isToolExercise ? (
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Dumbbell className="h-4 w-4 text-primary" />
                  )}
                  <span className={exercise.isToolExercise ? 'text-muted-foreground' : 'text-primary'}>
                    {exercise.name}
                  </span>
                  {exercise.isToolExercise && (
                    <span className="text-xs bg-muted px-2 py-0.5 rounded">outil</span>
                  )}
                </div>
                {!presetLoaded && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeExercise(exIndex)}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {exercise.sets.map((set, setIndex) => (
                <div
                  key={setIndex}
                  className={`flex items-center gap-1.5 p-2 rounded-lg transition-colors ${
                    set.completed ? 'bg-green-500/10' : 'bg-background'
                  }`}
                >
                  <Button
                    variant={set.completed ? 'default' : 'outline'}
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => toggleSetCompleted(exIndex, setIndex)}
                  >
                    {set.completed ? <Check className="h-3 w-3" /> : <span className="text-xs">{setIndex + 1}</span>}
                  </Button>

                  {!exercise.isToolExercise ? (
                    <>
                      {set.target && (
                        <span className="text-[11px] text-muted-foreground shrink-0 w-12">
                          {set.target.reps}×{set.target.weight}
                        </span>
                      )}
                      <Input
                        type="number"
                        min="0"
                        step="2.5"
                        value={set.weight || ''}
                        onChange={(e) => updateSet(exIndex, setIndex, 'weight', e.target.value)}
                        placeholder="kg"
                        className="w-16 h-7 text-center text-sm px-1"
                      />
                      <span className="text-muted-foreground text-xs">×</span>
                      <Input
                        type="number"
                        min="0"
                        value={set.reps || ''}
                        onChange={(e) => updateSet(exIndex, setIndex, 'reps', e.target.value)}
                        placeholder="reps"
                        className="w-12 h-7 text-center text-sm px-1"
                      />
                      {set.weight > 0 && set.reps > 0 && (
                        <span className="text-[10px] text-primary whitespace-nowrap">
                          {calculateOneRepMax(set.weight, set.reps)}kg
                        </span>
                      )}
                      {exercise.sets.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-auto shrink-0 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => removeSet(exIndex, setIndex)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground flex-1">
                      {exercise.sets[0]?.target ? `${exercise.sets.length} × ${exercise.sets[0].target.reps} reps` : 'À ta convenance'}
                    </span>
                  )}
                </div>
              ))}

              {!exercise.isToolExercise && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addSet(exIndex)}
                  className="w-full mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter une série
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

        {!presetLoaded && (
          <Card className="border-2 border-dashed">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-3">Ajouter un exercice</p>
              <div className="grid grid-cols-3 gap-2">
                {(['squat', 'bench', 'deadlift'] as ExerciseType[]).map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    onClick={() => addManualExercise(type)}
                  >
                    {exerciseLabels[type]}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 sticky bottom-20 md:bottom-4 pt-4 bg-background/95 backdrop-blur-sm rounded-xl p-4 border-2">
          {autoSaving && (
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Sauvegarde auto...
            </div>
          )}
          <Button
            variant="outline"
            onClick={handleCancel}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={saveWorkout}
            disabled={!hasCompletedSets || saving}
            className="flex-1"
          >
            {saving ? 'Sauvegarde...' : 'Terminer le Workout'}
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        title="Annuler la séance ?"
        description="Ta séance en cours sera supprimée. Cette action est irréversible."
        confirmLabel="Annuler la séance"
        cancelLabel="Continuer"
        onConfirm={confirmCancel}
      />
    </div>
  );
}
