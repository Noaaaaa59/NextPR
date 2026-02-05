import { SetPrescription } from './types';

// 5/3/1 Jim Wendler - Programme classique en 4 semaines
// Basé sur le Training Max (TM = 90% du 1RM réel)
// Source: https://www.powerliftingmag.fr/comment-etre-plus-fort-la-methode-531-de-jim-wendler/
export const WEEK_531: Record<number, { heavy: SetPrescription[]; light: SetPrescription[]; bbb?: SetPrescription[]; useTrainingMax?: boolean; isDeload?: boolean; isTestWeek?: boolean }> = {
  // Semaine 1 - "5s Week" (basé sur TM)
  1: {
    heavy: [
      { reps: 5, percentage: 65 },
      { reps: 5, percentage: 75 },
      { reps: 5, percentage: 85, amrap: true },
    ],
    light: [
      { reps: 5, percentage: 65 },
      { reps: 5, percentage: 65 },
      { reps: 5, percentage: 65 },
    ],
    bbb: [
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
    ],
    useTrainingMax: true,
  },
  // Semaine 2 - "3s Week" (basé sur TM)
  2: {
    heavy: [
      { reps: 3, percentage: 70 },
      { reps: 3, percentage: 80 },
      { reps: 3, percentage: 90, amrap: true },
    ],
    light: [
      { reps: 5, percentage: 60 },
      { reps: 5, percentage: 60 },
      { reps: 5, percentage: 60 },
    ],
    bbb: [
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
    ],
    useTrainingMax: true,
  },
  // Semaine 3 - "5/3/1 Week" (basé sur TM) - semaine la plus intense
  3: {
    heavy: [
      { reps: 5, percentage: 75 },
      { reps: 3, percentage: 85 },
      { reps: 1, percentage: 95, amrap: true },
    ],
    light: [
      { reps: 5, percentage: 60 },
      { reps: 5, percentage: 60 },
      { reps: 5, percentage: 60 },
    ],
    bbb: [
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
    ],
    useTrainingMax: true,
  },
  // Semaine 4 - "TEST PR" - tentative de nouveau record (+2.5kg bench, +5kg squat/deadlift)
  4: {
    heavy: [
      { reps: 3, percentage: 70 },
      { reps: 2, percentage: 80 },
      { reps: 1, percentage: 90 },
      { reps: 1, percentage: 100 },
      { reps: 1, percentage: 0, amrap: true }, // 0% = PR attempt, weight calculated separately
    ],
    light: [
      { reps: 3, percentage: 50 },
      { reps: 3, percentage: 50 },
    ],
    useTrainingMax: false,
    isTestWeek: true,
  },
};

// 5/3/1 étendu sur 6 semaines - 2 cycles de 3 semaines + déload final
export const WEEK_531_EXTENDED: Record<number, { heavy: SetPrescription[]; light: SetPrescription[]; bbb?: SetPrescription[]; useTrainingMax?: boolean; isDeload?: boolean; isTestWeek?: boolean }> = {
  // Cycle 1 - Semaine 1 "5s Week"
  1: {
    heavy: [
      { reps: 5, percentage: 65 },
      { reps: 5, percentage: 75 },
      { reps: 5, percentage: 85, amrap: true },
    ],
    light: [
      { reps: 5, percentage: 65 },
      { reps: 5, percentage: 65 },
      { reps: 5, percentage: 65 },
    ],
    bbb: [
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
    ],
    useTrainingMax: true,
  },
  // Cycle 1 - Semaine 2 "3s Week"
  2: {
    heavy: [
      { reps: 3, percentage: 70 },
      { reps: 3, percentage: 80 },
      { reps: 3, percentage: 90, amrap: true },
    ],
    light: [
      { reps: 5, percentage: 60 },
      { reps: 5, percentage: 60 },
      { reps: 5, percentage: 60 },
    ],
    bbb: [
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
    ],
    useTrainingMax: true,
  },
  // Cycle 1 - Semaine 3 "5/3/1 Week"
  3: {
    heavy: [
      { reps: 5, percentage: 75 },
      { reps: 3, percentage: 85 },
      { reps: 1, percentage: 95, amrap: true },
    ],
    light: [
      { reps: 5, percentage: 60 },
      { reps: 5, percentage: 60 },
      { reps: 5, percentage: 60 },
    ],
    bbb: [
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
    ],
    useTrainingMax: true,
  },
  // Cycle 2 - Semaine 4 "5s Week" (avec +5kg squat/deadlift, +2.5kg bench sur TM)
  4: {
    heavy: [
      { reps: 5, percentage: 65 },
      { reps: 5, percentage: 75 },
      { reps: 5, percentage: 85, amrap: true },
    ],
    light: [
      { reps: 5, percentage: 65 },
      { reps: 5, percentage: 65 },
      { reps: 5, percentage: 65 },
    ],
    bbb: [
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
    ],
    useTrainingMax: true,
  },
  // Cycle 2 - Semaine 5 "3s Week"
  5: {
    heavy: [
      { reps: 3, percentage: 70 },
      { reps: 3, percentage: 80 },
      { reps: 3, percentage: 90, amrap: true },
    ],
    light: [
      { reps: 5, percentage: 60 },
      { reps: 5, percentage: 60 },
      { reps: 5, percentage: 60 },
    ],
    bbb: [
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
      { reps: 10, percentage: 50 },
    ],
    useTrainingMax: true,
  },
  // Semaine 6 - "TEST PR" - tentative de nouveau record (+2.5kg bench, +5kg squat/deadlift)
  6: {
    heavy: [
      { reps: 3, percentage: 70 },
      { reps: 2, percentage: 80 },
      { reps: 1, percentage: 90 },
      { reps: 1, percentage: 100 },
      { reps: 1, percentage: 0, amrap: true }, // 0% = PR attempt, weight calculated separately
    ],
    light: [
      { reps: 3, percentage: 50 },
      { reps: 3, percentage: 50 },
    ],
    useTrainingMax: false,
    isTestWeek: true,
  },
};

export function roundToPlate(weight: number, increment: number = 2.5): number {
  return Math.round(weight / increment) * increment;
}

export function calculateWorkingWeight(oneRepMax: number, percentage: number): number {
  return roundToPlate(oneRepMax * (percentage / 100));
}

export function calculateTrainingMax(oneRepMax: number): number {
  return roundToPlate(oneRepMax);
}

export function calculateWorkingWeight531(oneRepMax: number, percentage: number): number {
  const trainingMax = calculateTrainingMax(oneRepMax);
  return roundToPlate(trainingMax * (percentage / 100));
}
