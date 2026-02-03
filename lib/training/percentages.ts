import { SetPrescription } from './types';

// 6-week linear periodization - percentages based on ACTUAL 1RM (not training max)
// Goal: Peak to PR or new PR by week 6
export const WEEK_LINEAR: Record<number, { heavy: SetPrescription[]; light: SetPrescription[] }> = {
  1: {
    heavy: [
      { reps: 5, percentage: 72.5 },
      { reps: 5, percentage: 72.5 },
      { reps: 5, percentage: 72.5 },
      { reps: 5, percentage: 72.5 },
      { reps: 5, percentage: 72.5 },
    ],
    light: [
      { reps: 8, percentage: 60 },
      { reps: 8, percentage: 60 },
      { reps: 8, percentage: 60 },
    ],
  },
  2: {
    heavy: [
      { reps: 4, percentage: 77.5 },
      { reps: 4, percentage: 77.5 },
      { reps: 4, percentage: 77.5 },
      { reps: 4, percentage: 77.5 },
    ],
    light: [
      { reps: 6, percentage: 65 },
      { reps: 6, percentage: 65 },
      { reps: 6, percentage: 65 },
    ],
  },
  3: {
    heavy: [
      { reps: 3, percentage: 82.5 },
      { reps: 3, percentage: 82.5 },
      { reps: 3, percentage: 82.5 },
      { reps: 3, percentage: 82.5 },
      { reps: 3, percentage: 82.5 },
    ],
    light: [
      { reps: 5, percentage: 70 },
      { reps: 5, percentage: 70 },
      { reps: 5, percentage: 70 },
    ],
  },
  4: {
    heavy: [
      { reps: 2, percentage: 87.5 },
      { reps: 2, percentage: 87.5 },
      { reps: 2, percentage: 87.5 },
      { reps: 2, percentage: 87.5 },
    ],
    light: [
      { reps: 4, percentage: 72.5 },
      { reps: 4, percentage: 72.5 },
      { reps: 4, percentage: 72.5 },
    ],
  },
  5: {
    heavy: [
      { reps: 2, percentage: 90 },
      { reps: 2, percentage: 92.5 },
      { reps: 1, percentage: 95 },
    ],
    light: [
      { reps: 3, percentage: 75 },
      { reps: 3, percentage: 75 },
      { reps: 3, percentage: 75 },
    ],
  },
  6: {
    heavy: [
      { reps: 1, percentage: 92.5 },
      { reps: 1, percentage: 97.5 },
      { reps: 1, percentage: 102.5, amrap: true },
    ],
    light: [
      { reps: 3, percentage: 60 },
      { reps: 3, percentage: 60 },
    ],
  },
};

// 5/3/1 style - 4 weeks
export const WEEK_531: Record<number, { heavy: SetPrescription[]; light: SetPrescription[] }> = {
  1: {
    heavy: [
      { reps: 5, percentage: 65 },
      { reps: 5, percentage: 75 },
      { reps: 5, percentage: 85, amrap: true },
    ],
    light: [
      { reps: 8, percentage: 55 },
      { reps: 8, percentage: 55 },
      { reps: 8, percentage: 55 },
    ],
  },
  2: {
    heavy: [
      { reps: 3, percentage: 70 },
      { reps: 3, percentage: 80 },
      { reps: 3, percentage: 90, amrap: true },
    ],
    light: [
      { reps: 6, percentage: 60 },
      { reps: 6, percentage: 60 },
      { reps: 6, percentage: 60 },
    ],
  },
  3: {
    heavy: [
      { reps: 5, percentage: 75 },
      { reps: 3, percentage: 85 },
      { reps: 1, percentage: 95, amrap: true },
    ],
    light: [
      { reps: 5, percentage: 65 },
      { reps: 5, percentage: 65 },
      { reps: 5, percentage: 65 },
    ],
  },
  4: {
    heavy: [
      { reps: 5, percentage: 40 },
      { reps: 5, percentage: 50 },
      { reps: 5, percentage: 60 },
    ],
    light: [
      { reps: 5, percentage: 40 },
      { reps: 5, percentage: 40 },
    ],
  },
};

// Block periodization - 8 weeks
export const WEEK_BLOCK: Record<number, { heavy: SetPrescription[]; light: SetPrescription[] }> = {
  // Accumulation phase (weeks 1-3)
  1: {
    heavy: [
      { reps: 8, percentage: 67.5 },
      { reps: 8, percentage: 67.5 },
      { reps: 8, percentage: 67.5 },
      { reps: 8, percentage: 67.5 },
    ],
    light: [
      { reps: 10, percentage: 55 },
      { reps: 10, percentage: 55 },
      { reps: 10, percentage: 55 },
    ],
  },
  2: {
    heavy: [
      { reps: 6, percentage: 72.5 },
      { reps: 6, percentage: 72.5 },
      { reps: 6, percentage: 72.5 },
      { reps: 6, percentage: 72.5 },
    ],
    light: [
      { reps: 8, percentage: 60 },
      { reps: 8, percentage: 60 },
      { reps: 8, percentage: 60 },
    ],
  },
  3: {
    heavy: [
      { reps: 5, percentage: 77.5 },
      { reps: 5, percentage: 77.5 },
      { reps: 5, percentage: 77.5 },
      { reps: 5, percentage: 77.5 },
    ],
    light: [
      { reps: 6, percentage: 65 },
      { reps: 6, percentage: 65 },
      { reps: 6, percentage: 65 },
    ],
  },
  // Intensification phase (weeks 4-6)
  4: {
    heavy: [
      { reps: 4, percentage: 82.5 },
      { reps: 4, percentage: 82.5 },
      { reps: 4, percentage: 82.5 },
      { reps: 4, percentage: 82.5 },
    ],
    light: [
      { reps: 5, percentage: 70 },
      { reps: 5, percentage: 70 },
      { reps: 5, percentage: 70 },
    ],
  },
  5: {
    heavy: [
      { reps: 3, percentage: 87.5 },
      { reps: 3, percentage: 87.5 },
      { reps: 3, percentage: 87.5 },
    ],
    light: [
      { reps: 4, percentage: 72.5 },
      { reps: 4, percentage: 72.5 },
      { reps: 4, percentage: 72.5 },
    ],
  },
  6: {
    heavy: [
      { reps: 2, percentage: 90 },
      { reps: 2, percentage: 90 },
      { reps: 2, percentage: 92.5 },
    ],
    light: [
      { reps: 3, percentage: 75 },
      { reps: 3, percentage: 75 },
    ],
  },
  // Peaking phase (week 7) + Deload (week 8)
  7: {
    heavy: [
      { reps: 1, percentage: 95 },
      { reps: 1, percentage: 100 },
      { reps: 1, percentage: 102.5, amrap: true },
    ],
    light: [
      { reps: 3, percentage: 65 },
      { reps: 3, percentage: 65 },
    ],
  },
  8: {
    heavy: [
      { reps: 5, percentage: 50 },
      { reps: 5, percentage: 55 },
      { reps: 5, percentage: 60 },
    ],
    light: [
      { reps: 5, percentage: 45 },
      { reps: 5, percentage: 45 },
    ],
  },
};

// Hypertrophy focused - 4 weeks
export const WEEK_HYPERTROPHY: Record<number, { heavy: SetPrescription[]; light: SetPrescription[] }> = {
  1: {
    heavy: [
      { reps: 10, percentage: 62.5 },
      { reps: 10, percentage: 62.5 },
      { reps: 10, percentage: 62.5 },
      { reps: 10, percentage: 62.5 },
    ],
    light: [
      { reps: 12, percentage: 55 },
      { reps: 12, percentage: 55 },
      { reps: 12, percentage: 55 },
    ],
  },
  2: {
    heavy: [
      { reps: 10, percentage: 65 },
      { reps: 10, percentage: 65 },
      { reps: 10, percentage: 65 },
      { reps: 10, percentage: 65 },
    ],
    light: [
      { reps: 12, percentage: 57.5 },
      { reps: 12, percentage: 57.5 },
      { reps: 12, percentage: 57.5 },
    ],
  },
  3: {
    heavy: [
      { reps: 8, percentage: 70 },
      { reps: 8, percentage: 70 },
      { reps: 8, percentage: 70 },
      { reps: 8, percentage: 70 },
      { reps: 8, percentage: 70 },
    ],
    light: [
      { reps: 10, percentage: 60 },
      { reps: 10, percentage: 60 },
      { reps: 10, percentage: 60 },
    ],
  },
  4: {
    heavy: [
      { reps: 8, percentage: 72.5 },
      { reps: 8, percentage: 72.5 },
      { reps: 8, percentage: 72.5 },
      { reps: 8, percentage: 72.5 },
      { reps: 8, percentage: 72.5, amrap: true },
    ],
    light: [
      { reps: 10, percentage: 62.5 },
      { reps: 10, percentage: 62.5 },
      { reps: 10, percentage: 62.5 },
    ],
  },
};

export const ACCESSORY_CONFIG = {
  hypertrophy: { sets: 3, reps: '10-12' },
  strength: { sets: 3, reps: '6-8' },
  deload: { sets: 2, reps: '10-12' },
};

export const ACCESSORIES_BY_LIFT: Record<'squat' | 'bench' | 'deadlift', string[]> = {
  squat: ['Front Squat', 'Bulgarian Split Squat', 'Leg Press', 'Leg Curl', 'Leg Extension'],
  bench: ['Incline Dumbbell Press', 'Dips', 'Overhead Press', 'Triceps Pushdown', 'Face Pulls'],
  deadlift: ['Romanian Deadlift', 'Barbell Row', 'Pull-ups', 'Back Extension', 'Lat Pulldown'],
};

export function roundToPlate(weight: number, increment: number = 2.5): number {
  return Math.round(weight / increment) * increment;
}

export function calculateWorkingWeight(oneRepMax: number, percentage: number): number {
  return roundToPlate(oneRepMax * (percentage / 100));
}
