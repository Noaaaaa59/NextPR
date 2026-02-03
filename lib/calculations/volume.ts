import { Set, Exercise, Workout } from '@/types/workout';

export function calculateVolumeLoad(sets: Set[]): number {
  return sets.reduce((total, set) => {
    if (set.completed) {
      return total + set.weight * set.reps;
    }
    return total;
  }, 0);
}

export function calculateExerciseVolume(exercise: Exercise): number {
  return calculateVolumeLoad(exercise.sets);
}

export function calculateWorkoutVolume(workout: Workout): number {
  return workout.exercises.reduce((total, exercise) => {
    return total + calculateExerciseVolume(exercise);
  }, 0);
}

export function calculateTotalReps(sets: Set[]): number {
  return sets.reduce((total, set) => {
    if (set.completed) {
      return total + set.reps;
    }
    return total;
  }, 0);
}

export function calculateAverageIntensity(sets: Set[], oneRepMax: number): number {
  const completedSets = sets.filter(set => set.completed);
  if (completedSets.length === 0) return 0;

  const totalIntensity = completedSets.reduce((sum, set) => {
    const percentage = (set.weight / oneRepMax) * 100;
    return sum + percentage;
  }, 0);

  return Math.round(totalIntensity / completedSets.length);
}
