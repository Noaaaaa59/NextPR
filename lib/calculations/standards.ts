import { StrengthLevel } from '@/types/analytics';
import { Gender, WeightCategory, getWeightCategory } from '@/types/user';

type Exercise = 'squat' | 'bench' | 'deadlift';

interface CategoryStandards {
  untrained: number;
  novice: number;
  intermediate: number;
  advanced: number;
  elite: number;
  international: number;
}

const maleStandards: Record<WeightCategory, Record<Exercise, CategoryStandards>> = {
  '59': {
    squat: { untrained: 40, novice: 70, intermediate: 100, advanced: 135, elite: 170, international: 215 },
    bench: { untrained: 30, novice: 50, intermediate: 75, advanced: 100, elite: 130, international: 165 },
    deadlift: { untrained: 50, novice: 85, intermediate: 120, advanced: 160, elite: 200, international: 255 },
  },
  '66': {
    squat: { untrained: 45, novice: 80, intermediate: 115, advanced: 155, elite: 195, international: 250 },
    bench: { untrained: 35, novice: 58, intermediate: 85, advanced: 115, elite: 150, international: 190 },
    deadlift: { untrained: 55, novice: 95, intermediate: 140, advanced: 185, elite: 230, international: 290 },
  },
  '74': {
    squat: { untrained: 50, novice: 90, intermediate: 130, advanced: 175, elite: 220, international: 285 },
    bench: { untrained: 38, novice: 65, intermediate: 95, advanced: 130, elite: 170, international: 215 },
    deadlift: { untrained: 60, novice: 110, intermediate: 160, advanced: 210, elite: 265, international: 330 },
  },
  '83': {
    squat: { untrained: 55, novice: 100, intermediate: 145, advanced: 195, elite: 245, international: 320 },
    bench: { untrained: 42, novice: 72, intermediate: 105, advanced: 145, elite: 190, international: 245 },
    deadlift: { untrained: 70, novice: 120, intermediate: 175, advanced: 235, elite: 295, international: 370 },
  },
  '93': {
    squat: { untrained: 60, novice: 110, intermediate: 160, advanced: 215, elite: 275, international: 355 },
    bench: { untrained: 45, novice: 80, intermediate: 115, advanced: 160, elite: 210, international: 270 },
    deadlift: { untrained: 75, novice: 130, intermediate: 195, advanced: 260, elite: 330, international: 410 },
  },
  '105': {
    squat: { untrained: 65, novice: 120, intermediate: 175, advanced: 240, elite: 305, international: 395 },
    bench: { untrained: 50, novice: 88, intermediate: 130, advanced: 180, elite: 235, international: 300 },
    deadlift: { untrained: 80, novice: 145, intermediate: 215, advanced: 290, elite: 365, international: 455 },
  },
  '120': {
    squat: { untrained: 70, novice: 130, intermediate: 195, advanced: 265, elite: 340, international: 435 },
    bench: { untrained: 55, novice: 95, intermediate: 145, advanced: 200, elite: 260, international: 330 },
    deadlift: { untrained: 90, novice: 160, intermediate: 235, advanced: 320, elite: 405, international: 500 },
  },
  '120+': {
    squat: { untrained: 75, novice: 140, intermediate: 210, advanced: 290, elite: 375, international: 475 },
    bench: { untrained: 58, novice: 105, intermediate: 160, advanced: 220, elite: 285, international: 365 },
    deadlift: { untrained: 95, novice: 175, intermediate: 260, advanced: 355, elite: 445, international: 550 },
  },
  '47': {
    squat: { untrained: 25, novice: 42, intermediate: 62, advanced: 85, elite: 110, international: 140 },
    bench: { untrained: 18, novice: 30, intermediate: 45, advanced: 60, elite: 80, international: 100 },
    deadlift: { untrained: 32, novice: 55, intermediate: 80, advanced: 110, elite: 140, international: 175 },
  },
  '52': {
    squat: { untrained: 28, novice: 48, intermediate: 70, advanced: 95, elite: 125, international: 160 },
    bench: { untrained: 20, novice: 34, intermediate: 50, advanced: 70, elite: 92, international: 115 },
    deadlift: { untrained: 36, novice: 62, intermediate: 92, advanced: 125, elite: 160, international: 200 },
  },
  '57': {
    squat: { untrained: 32, novice: 54, intermediate: 80, advanced: 110, elite: 145, international: 185 },
    bench: { untrained: 22, novice: 38, intermediate: 58, advanced: 82, elite: 108, international: 135 },
    deadlift: { untrained: 40, novice: 70, intermediate: 105, advanced: 145, elite: 185, international: 230 },
  },
  '63': {
    squat: { untrained: 36, novice: 62, intermediate: 92, advanced: 128, elite: 168, international: 215 },
    bench: { untrained: 25, novice: 44, intermediate: 68, advanced: 95, elite: 125, international: 160 },
    deadlift: { untrained: 45, novice: 80, intermediate: 120, advanced: 170, elite: 215, international: 270 },
  },
  '69': {
    squat: { untrained: 40, novice: 70, intermediate: 105, advanced: 145, elite: 190, international: 245 },
    bench: { untrained: 28, novice: 50, intermediate: 76, advanced: 108, elite: 142, international: 180 },
    deadlift: { untrained: 50, novice: 88, intermediate: 135, advanced: 190, elite: 245, international: 305 },
  },
  '76': {
    squat: { untrained: 44, novice: 78, intermediate: 118, advanced: 165, elite: 215, international: 275 },
    bench: { untrained: 30, novice: 55, intermediate: 85, advanced: 120, elite: 158, international: 200 },
    deadlift: { untrained: 55, novice: 98, intermediate: 150, advanced: 210, elite: 270, international: 340 },
  },
  '84': {
    squat: { untrained: 48, novice: 85, intermediate: 130, advanced: 180, elite: 235, international: 300 },
    bench: { untrained: 34, novice: 60, intermediate: 95, advanced: 135, elite: 175, international: 220 },
    deadlift: { untrained: 60, novice: 108, intermediate: 165, advanced: 230, elite: 295, international: 370 },
  },
  '84+': {
    squat: { untrained: 52, novice: 95, intermediate: 145, advanced: 200, elite: 260, international: 335 },
    bench: { untrained: 38, novice: 68, intermediate: 105, advanced: 150, elite: 195, international: 250 },
    deadlift: { untrained: 65, novice: 120, intermediate: 185, advanced: 255, elite: 330, international: 410 },
  },
};

const femaleStandards = maleStandards;

export function getStrengthLevel(
  exercise: Exercise,
  weight: number,
  bodyweight: number,
  gender: Gender = 'male'
): StrengthLevel {
  const category = getWeightCategory(bodyweight, gender);
  const standards = gender === 'male' ? maleStandards[category] : femaleStandards[category];
  const exerciseStandards = standards[exercise];

  if (weight >= exerciseStandards.international) return 'international';
  if (weight >= exerciseStandards.elite) return 'elite';
  if (weight >= exerciseStandards.advanced) return 'advanced';
  if (weight >= exerciseStandards.intermediate) return 'intermediate';
  if (weight >= exerciseStandards.novice) return 'novice';
  return 'untrained';
}

export function getStandardWeight(
  exercise: Exercise,
  bodyweight: number,
  level: StrengthLevel,
  gender: Gender = 'male'
): number {
  const category = getWeightCategory(bodyweight, gender);
  const standards = gender === 'male' ? maleStandards[category] : femaleStandards[category];
  return standards[exercise][level];
}

export function calculateWilksScore(
  total: number,
  bodyweight: number,
  isMale: boolean = true
): number {
  const coefficients = isMale
    ? [-216.0475144, 16.2606339, -0.002388645, -0.00113732, 7.01863e-6, -1.291e-8]
    : [594.31747775582, -27.23842536447, 0.82112226871, -0.00930733913, 4.731582e-5, -9.054e-8];

  const [a, b, c, d, e, f] = coefficients;
  const denominator = a + b * bodyweight + c * Math.pow(bodyweight, 2) +
    d * Math.pow(bodyweight, 3) + e * Math.pow(bodyweight, 4) +
    f * Math.pow(bodyweight, 5);

  const wilks = (500 * total) / denominator;
  return Math.round(wilks * 100) / 100;
}

export function getAllStandards(
  exercise: Exercise,
  bodyweight: number,
  gender: Gender = 'male'
): Record<StrengthLevel, number> {
  const category = getWeightCategory(bodyweight, gender);
  const standards = gender === 'male' ? maleStandards[category] : femaleStandards[category];
  return standards[exercise];
}

export function getCategoryLabel(category: WeightCategory, gender: Gender): string {
  const suffix = category.includes('+') ? '' : ' kg';
  return `${category}${suffix}`;
}
