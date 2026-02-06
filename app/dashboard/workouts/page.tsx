'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Calendar, Dumbbell, Trash2, Pencil, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useWorkouts } from '@/lib/hooks/useFirestoreData';
import { updateWorkout, deleteWorkout } from '@/lib/firebase/firestore';
import { calculateOneRepMax } from '@/lib/calculations/oneRepMax';
import { mutate } from 'swr';
import { Workout } from '@/types/workout';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function WorkoutsPage() {
  const { user } = useAuth();
  const { workouts, isLoading: loading, refresh } = useWorkouts(user?.uid);
  const [editingWorkoutId, setEditingWorkoutId] = useState<string | null>(null);
  const [editedWorkout, setEditedWorkout] = useState<Workout | null>(null);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const startEditing = (workout: Workout) => {
    if (!workout.id) return;
    setEditingWorkoutId(workout.id);
    setEditedWorkout(JSON.parse(JSON.stringify(workout)));
    setExpandedWorkoutId(workout.id);
  };

  const cancelEditing = () => {
    setEditingWorkoutId(null);
    setEditedWorkout(null);
  };

  const saveEditing = async () => {
    if (!user || !editedWorkout || !editingWorkoutId) return;

    try {
      await updateWorkout(user.uid, editingWorkoutId, {
        exercises: editedWorkout.exercises,
        notes: editedWorkout.notes
      });
      await refresh();
      setEditingWorkoutId(null);
      setEditedWorkout(null);
    } catch (error) {
      console.error('Error updating workout:', error);
      setError('Erreur lors de la modification. Veuillez réessayer.');
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!user) return;

    setDeleting(workoutId);
    try {
      await deleteWorkout(user.uid, workoutId);
      await refresh();
      // Invalidate PRs and other stats caches since lifts were also deleted
      mutate(`prs-${user.uid}`);
      mutate(`estimated-${user.uid}`);
      mutate(`best-session-${user.uid}`);
    } catch (error) {
      console.error('Error deleting workout:', error);
      setError('Erreur lors de la suppression. Veuillez réessayer.');
    } finally {
      setDeleting(null);
      setDeleteConfirmId(null);
    }
  };

  const updateExerciseName = (exIndex: number, name: string) => {
    if (!editedWorkout) return;
    const updated = { ...editedWorkout };
    updated.exercises[exIndex].name = name;
    setEditedWorkout(updated);
  };

  const updateSet = (exIndex: number, setIndex: number, field: 'weight' | 'reps', value: number) => {
    if (!editedWorkout) return;
    const updated = { ...editedWorkout };
    updated.exercises[exIndex].sets[setIndex][field] = value;
    setEditedWorkout(updated);
  };

  const deleteSet = (exIndex: number, setIndex: number) => {
    if (!editedWorkout) return;
    const updated = { ...editedWorkout };
    if (updated.exercises[exIndex].sets.length > 1) {
      updated.exercises[exIndex].sets.splice(setIndex, 1);
      setEditedWorkout(updated);
    }
  };

  const addSet = (exIndex: number) => {
    if (!editedWorkout) return;
    const updated = { ...editedWorkout };
    const lastSet = updated.exercises[exIndex].sets[updated.exercises[exIndex].sets.length - 1];
    updated.exercises[exIndex].sets.push({
      weight: lastSet?.weight || 0,
      reps: lastSet?.reps || 0,
      completed: true
    });
    setEditedWorkout(updated);
  };

  const deleteExercise = (exIndex: number) => {
    if (!editedWorkout) return;
    const updated = { ...editedWorkout };
    if (updated.exercises.length > 1) {
      updated.exercises.splice(exIndex, 1);
      setEditedWorkout(updated);
    }
  };

  const addExercise = (type: 'squat' | 'bench' | 'deadlift') => {
    if (!editedWorkout) return;
    const updated = { ...editedWorkout };
    const names = { squat: 'Squat', bench: 'Bench Press', deadlift: 'Deadlift' };
    updated.exercises.push({
      name: names[type],
      type,
      sets: [{ weight: 0, reps: 0, completed: true }]
    });
    setEditedWorkout(updated);
  };

  const toggleExpanded = (workoutId: string | undefined) => {
    if (!workoutId || editingWorkoutId === workoutId) return;
    setExpandedWorkoutId(expandedWorkoutId === workoutId ? null : workoutId);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Mes Entraînements</h1>
          <p className="text-sm text-muted-foreground">
            Historique et création de workouts
          </p>
        </div>
        <Button size="default" className="w-full sm:w-auto" asChild>
          <Link href="/dashboard/workouts/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau Workout
          </Link>
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <Card className="border-2">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Historique ({workouts.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">Chargement...</p>
            </div>
          ) : workouts.length === 0 ? (
            <div className="text-center py-8">
              <Dumbbell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                Aucun entraînement enregistré
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/workouts/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Commencer
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {workouts.map((workout) => {
                const isEditing = editingWorkoutId === workout.id;
                const isExpanded = expandedWorkoutId === workout.id || isEditing;
                const currentWorkout = isEditing ? editedWorkout : workout;

                if (!currentWorkout) return null;

                return (
                  <div
                    key={workout.id}
                    className={`border-2 rounded-xl transition-all ${
                      isEditing ? 'border-primary bg-primary/5' : 'hover:border-primary/30'
                    }`}
                  >
                    <div
                      className="p-3 flex items-center justify-between cursor-pointer"
                      onClick={() => toggleExpanded(workout.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">
                          {formatDate(workout.date)}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {workout.exercises.length} exercice{workout.exercises.length > 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {!isEditing && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(workout);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                              disabled={deleting === workout.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (workout.id) setDeleteConfirmId(workout.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-3">
                        {currentWorkout.exercises.map((exercise, exIndex) => (
                          <div key={exIndex} className="border-l-2 border-primary/30 pl-3">
                            <div className="flex items-center gap-2 mb-2">
                              {isEditing ? (
                                <>
                                  <Input
                                    value={exercise.name}
                                    onChange={(e) => updateExerciseName(exIndex, e.target.value)}
                                    className="h-7 text-sm font-semibold text-primary flex-1"
                                  />
                                  {currentWorkout.exercises.length > 1 && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive shrink-0"
                                      onClick={() => deleteExercise(exIndex)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <h4 className="font-semibold text-sm text-primary">
                                  {exercise.name}
                                </h4>
                              )}
                            </div>

                            <div className="space-y-1">
                              {exercise.sets.map((set, setIndex) => (
                                <div key={setIndex} className="flex items-center gap-1.5 text-sm">
                                  <span className="text-muted-foreground text-xs w-6">
                                    {setIndex + 1}.
                                  </span>
                                  {isEditing ? (
                                    <>
                                      <Input
                                        type="number"
                                        value={set.weight || ''}
                                        onChange={(e) => updateSet(exIndex, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                                        className="w-14 h-6 text-center text-xs px-1"
                                      />
                                      <span className="text-xs text-muted-foreground">kg ×</span>
                                      <Input
                                        type="number"
                                        value={set.reps || ''}
                                        onChange={(e) => updateSet(exIndex, setIndex, 'reps', parseInt(e.target.value) || 0)}
                                        className="w-10 h-6 text-center text-xs px-1"
                                      />
                                      <span className="text-xs text-muted-foreground">reps</span>
                                      {exercise.sets.length > 1 && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-5 w-5 ml-auto hover:bg-destructive/10 hover:text-destructive"
                                          onClick={() => deleteSet(exIndex, setIndex)}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <span className="font-medium">
                                        {set.weight}kg × {set.reps}
                                      </span>
                                      <span className="text-primary/70 text-xs ml-auto">
                                        {calculateOneRepMax(set.weight, set.reps)}kg
                                      </span>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>

                            {isEditing && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => addSet(exIndex)}
                                className="mt-2 h-6 text-xs w-full"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Ajouter série
                              </Button>
                            )}
                          </div>
                        ))}

                        {isEditing && (
                          <>
                            <div className="border-2 border-dashed rounded-lg p-2">
                              <p className="text-xs text-muted-foreground mb-2">Ajouter exercice:</p>
                              <div className="flex gap-1">
                                <Button variant="outline" size="sm" className="flex-1 h-6 text-xs" onClick={() => addExercise('squat')}>Squat</Button>
                                <Button variant="outline" size="sm" className="flex-1 h-6 text-xs" onClick={() => addExercise('bench')}>Bench</Button>
                                <Button variant="outline" size="sm" className="flex-1 h-6 text-xs" onClick={() => addExercise('deadlift')}>Deadlift</Button>
                              </div>
                            </div>
                            <div className="flex gap-2 pt-2 border-t">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={cancelEditing}
                                className="flex-1 h-8"
                              >
                                <X className="h-3 w-3 mr-1" />
                                Annuler
                              </Button>
                              <Button
                                size="sm"
                                onClick={saveEditing}
                                className="flex-1 h-8"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Sauvegarder
                              </Button>
                            </div>
                          </>
                        )}

                        {!isEditing && workout.notes && (
                          <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground italic">
                              {workout.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}
        title="Supprimer cet entraînement ?"
        description="L'entraînement et les records associés seront supprimés. Cette action est irréversible."
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        variant="destructive"
        loading={deleting !== null}
        onConfirm={() => { if (deleteConfirmId) handleDeleteWorkout(deleteConfirmId); }}
      />
    </div>
  );
}
