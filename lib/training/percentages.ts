import { SetPrescription } from './types';

// 6-week linear periodization - percentages based on ACTUAL 1RM (not training max)
// Goal: Peak to PR or new PR by week 6
// Structure: Volume → Force → Peak → Déload → TEST PR
export const WEEK_LINEAR: Record<number, { heavy: SetPrescription[]; light: SetPrescription[]; isDeload?: boolean }> = {
  // Semaine 1 - Volume (5x5)
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
  // Semaine 2 - Force (4x4)
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
  // Semaine 3 - Force (5x3)
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
  // Semaine 4 - Peak (doubles et singles)
  4: {
    heavy: [
      { reps: 2, percentage: 87.5 },
      { reps: 2, percentage: 90 },
      { reps: 1, percentage: 92.5 },
      { reps: 1, percentage: 95 },
    ],
    light: [
      { reps: 4, percentage: 70 },
      { reps: 4, percentage: 70 },
      { reps: 4, percentage: 70 },
    ],
  },
  // Semaine 5 - DÉLOAD (récupération avant test)
  5: {
    heavy: [
      { reps: 5, percentage: 50 },
      { reps: 5, percentage: 55 },
      { reps: 5, percentage: 60 },
    ],
    light: [
      { reps: 5, percentage: 45 },
      { reps: 5, percentage: 45 },
    ],
    isDeload: true,
  },
  // Semaine 6 - TEST DE PR
  6: {
    heavy: [
      { reps: 3, percentage: 70 },
      { reps: 2, percentage: 80 },
      { reps: 1, percentage: 90 },
      { reps: 1, percentage: 97.5 },
      { reps: 1, percentage: 102.5, amrap: true },
    ],
    light: [
      { reps: 3, percentage: 50 },
      { reps: 3, percentage: 50 },
    ],
  },
};

// 5/3/1 Jim Wendler modifié - 4 weeks avec TEST DAY
// Semaines 1-3: Progression classique 5/3/1 basée sur Training Max (TM = 90% du 1RM)
// Semaine 4: TEST DE PR avec singles lourds (basé sur 1RM réel, pas TM)
export const WEEK_531: Record<number, { heavy: SetPrescription[]; light: SetPrescription[]; bbb?: SetPrescription[]; useTrainingMax?: boolean }> = {
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
  // Semaine 3 - "Singles Week" - Préparation au test (basé sur TM)
  3: {
    heavy: [
      { reps: 3, percentage: 75 },
      { reps: 2, percentage: 85 },
      { reps: 1, percentage: 90 },
      { reps: 1, percentage: 95 },
    ],
    light: [
      { reps: 3, percentage: 60 },
      { reps: 3, percentage: 60 },
      { reps: 3, percentage: 60 },
    ],
    useTrainingMax: true,
  },
  // Semaine 4 - TEST DE PR (basé sur 1RM RÉEL, pas TM)
  4: {
    heavy: [
      { reps: 3, percentage: 70 },
      { reps: 2, percentage: 80 },
      { reps: 1, percentage: 90 },
      { reps: 1, percentage: 97.5 },
      { reps: 1, percentage: 102.5, amrap: true },
    ],
    light: [
      { reps: 3, percentage: 50 },
      { reps: 3, percentage: 50 },
    ],
    useTrainingMax: false, // Utilise le 1RM réel pour le test
  },
};

// 5/3/1 étendu sur 6 semaines - Volume → Force → Peak → Déload → TEST
export const WEEK_531_EXTENDED: Record<number, { heavy: SetPrescription[]; light: SetPrescription[]; bbb?: SetPrescription[]; useTrainingMax?: boolean; isDeload?: boolean }> = {
  // Semaine 1 - Volume (5x5) basé sur TM
  1: {
    heavy: [
      { reps: 5, percentage: 65 },
      { reps: 5, percentage: 70 },
      { reps: 5, percentage: 75 },
      { reps: 5, percentage: 75 },
      { reps: 5, percentage: 75, amrap: true },
    ],
    light: [
      { reps: 8, percentage: 55 },
      { reps: 8, percentage: 55 },
      { reps: 8, percentage: 55 },
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
  // Semaine 2 - Volume intensifié (5x5 plus lourd) basé sur TM
  2: {
    heavy: [
      { reps: 5, percentage: 70 },
      { reps: 5, percentage: 75 },
      { reps: 5, percentage: 80 },
      { reps: 5, percentage: 80 },
      { reps: 5, percentage: 80, amrap: true },
    ],
    light: [
      { reps: 6, percentage: 60 },
      { reps: 6, percentage: 60 },
      { reps: 6, percentage: 60 },
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
  // Semaine 3 - Force (triples) basé sur TM
  3: {
    heavy: [
      { reps: 3, percentage: 75 },
      { reps: 3, percentage: 82.5 },
      { reps: 3, percentage: 87.5 },
      { reps: 3, percentage: 87.5, amrap: true },
    ],
    light: [
      { reps: 5, percentage: 65 },
      { reps: 5, percentage: 65 },
      { reps: 5, percentage: 65 },
    ],
    useTrainingMax: true,
  },
  // Semaine 4 - Peak (doubles et singles lourds) basé sur TM
  4: {
    heavy: [
      { reps: 3, percentage: 80 },
      { reps: 2, percentage: 87.5 },
      { reps: 1, percentage: 92.5 },
      { reps: 1, percentage: 97.5 },
    ],
    light: [
      { reps: 4, percentage: 65 },
      { reps: 4, percentage: 65 },
      { reps: 4, percentage: 65 },
    ],
    useTrainingMax: true,
  },
  // Semaine 5 - DÉLOAD (récupération avant test)
  5: {
    heavy: [
      { reps: 5, percentage: 50 },
      { reps: 5, percentage: 55 },
      { reps: 5, percentage: 60 },
    ],
    light: [
      { reps: 5, percentage: 45 },
      { reps: 5, percentage: 45 },
    ],
    useTrainingMax: true,
    isDeload: true,
  },
  // Semaine 6 - TEST DE PR (basé sur 1RM RÉEL)
  6: {
    heavy: [
      { reps: 3, percentage: 70 },
      { reps: 2, percentage: 80 },
      { reps: 1, percentage: 90 },
      { reps: 1, percentage: 97.5 },
      { reps: 1, percentage: 102.5, amrap: true },
    ],
    light: [
      { reps: 3, percentage: 50 },
      { reps: 3, percentage: 50 },
    ],
    useTrainingMax: false, // Utilise le 1RM réel pour le test
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

export function calculateTrainingMax(oneRepMax: number): number {
  return roundToPlate(oneRepMax * 0.9);
}

export function calculateWorkingWeight531(oneRepMax: number, percentage: number): number {
  const trainingMax = calculateTrainingMax(oneRepMax);
  return roundToPlate(trainingMax * (percentage / 100));
}

// Calcule le poids cible pour un test de PR avec progression garantie
// Pour les petits maxs (<80kg): +5kg minimum (plus réaliste pour débutants)
// Pour les maxs moyens (80-120kg): +2.5kg minimum
// Pour les gros maxs (>120kg): pourcentage standard
export function calculatePRTarget(oneRepMax: number, percentage: number): number {
  const rawTarget = oneRepMax * (percentage / 100);
  const roundedTarget = roundToPlate(rawTarget);

  // Garantir une progression minimale basée sur le niveau
  let minProgression: number;
  if (oneRepMax < 80) {
    minProgression = 5; // +5kg pour les débutants
  } else if (oneRepMax < 120) {
    minProgression = 2.5; // +2.5kg pour niveau intermédiaire
  } else {
    minProgression = 2.5; // Pour les avancés, le % fait déjà le job
  }

  const minTarget = oneRepMax + minProgression;

  // Retourne le plus grand des deux (arrondi à la plaque)
  return roundToPlate(Math.max(roundedTarget, minTarget));
}
