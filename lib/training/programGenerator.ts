import { StrengthLevel } from '@/types/analytics';
import { Experience } from '@/types/user';
import {
  TrainingGoal,
  CycleType,
  SetPrescription,
  ExercisePrescription,
  DayPrescription,
  WeekPrescription,
  GeneratedProgram,
  ProgramRecommendation,
} from './types';
import {
  WEEK_531,
  WEEK_LINEAR,
  WEEK_HYPERTROPHY,
  WEEK_BLOCK,
  ACCESSORY_CONFIG,
  ACCESSORIES_BY_LIFT,
  calculateWorkingWeight,
} from './percentages';

interface UserProfile {
  experience: Experience;
  strengthLevel: StrengthLevel;
  bodyweight: number;
  currentMaxes: {
    squat: number;
    bench: number;
    deadlift: number;
  };
  weeklyAvailability: number;
}

interface Maxes {
  squat: number;
  bench: number;
  deadlift: number;
}

function determineBestCycleType(profile: UserProfile): CycleType {
  const { strengthLevel } = profile;

  if (strengthLevel === 'untrained' || strengthLevel === 'novice') {
    return 'linear';
  }

  if (strengthLevel === 'intermediate') {
    return '531';
  }

  if (strengthLevel === 'advanced' || strengthLevel === 'elite') {
    return 'block';
  }

  return 'linear';
}

function determineGoal(profile: UserProfile): TrainingGoal {
  const { strengthLevel } = profile;

  if (strengthLevel === 'untrained' || strengthLevel === 'novice') {
    return 'general';
  }

  if (strengthLevel === 'intermediate') {
    return 'strength';
  }

  return 'peaking';
}

function getCycleDuration(cycleType: CycleType): number {
  switch (cycleType) {
    case '531':
      return 4;
    case 'linear':
      return 6;
    case 'block':
      return 8;
    case 'hypertrophy':
      return 4;
    default:
      return 6;
  }
}

function getWeekSets(cycleType: CycleType, weekNumber: number): { heavy: SetPrescription[]; light: SetPrescription[] } {
  switch (cycleType) {
    case '531':
      return WEEK_531[weekNumber] || WEEK_531[1];
    case 'linear':
      return WEEK_LINEAR[weekNumber] || WEEK_LINEAR[1];
    case 'hypertrophy':
      return WEEK_HYPERTROPHY[weekNumber] || WEEK_HYPERTROPHY[1];
    case 'block':
      return WEEK_BLOCK[weekNumber] || WEEK_BLOCK[1];
    default:
      return WEEK_LINEAR[1];
  }
}

function getWeekName(cycleType: CycleType, weekNumber: number, duration: number): string {
  const isDeload = (cycleType === '531' && weekNumber === 4) ||
                   (cycleType === 'block' && weekNumber === 8);

  if (isDeload) {
    return `Semaine ${weekNumber} - Déload`;
  }

  switch (cycleType) {
    case '531':
      const names531 = ['5s', '3s', '5/3/1'];
      return `Semaine ${weekNumber} - ${names531[weekNumber - 1] || 'Force'}`;
    case 'linear':
      if (weekNumber <= 2) return `Semaine ${weekNumber} - Volume`;
      if (weekNumber <= 4) return `Semaine ${weekNumber} - Force`;
      if (weekNumber === 5) return `Semaine ${weekNumber} - Peak`;
      return `Semaine ${weekNumber} - Test PR`;
    case 'hypertrophy':
      return `Semaine ${weekNumber} - Hypertrophie`;
    case 'block':
      if (weekNumber <= 3) return `Semaine ${weekNumber} - Accumulation`;
      if (weekNumber <= 6) return `Semaine ${weekNumber} - Intensification`;
      if (weekNumber === 7) return `Semaine ${weekNumber} - Peak`;
      return `Semaine ${weekNumber} - Déload`;
    default:
      return `Semaine ${weekNumber}`;
  }
}

function getWeekFocus(cycleType: CycleType, weekNumber: number): string {
  switch (cycleType) {
    case '531':
      const focus531 = [
        'Volume modéré, construire la base',
        'Intensité augmentée, moins de reps',
        'Semaine de test, AMRAP sur le dernier set',
        'Récupération active',
      ];
      return focus531[weekNumber - 1] || '';
    case 'linear':
      if (weekNumber <= 2) return 'Volume élevé, adaptation musculaire';
      if (weekNumber <= 4) return 'Transition vers la force, charges plus lourdes';
      if (weekNumber === 5) return 'Peak d\'intensité, préparation au max';
      return 'Test de nouveaux PRs - donne tout !';
    case 'hypertrophy':
      return 'Volume élevé, croissance musculaire';
    case 'block':
      if (weekNumber <= 3) return 'Accumulation de volume et technique';
      if (weekNumber <= 6) return 'Développement de la force max';
      if (weekNumber === 7) return 'Peaking - nouveaux PRs';
      return 'Récupération et régénération';
    default:
      return '';
  }
}

function generateAccessories(
  mainLift: 'squat' | 'bench' | 'deadlift',
  cycleType: CycleType,
  isDeload: boolean
): ExercisePrescription[] {
  const accessories = ACCESSORIES_BY_LIFT[mainLift];
  const config = isDeload ? ACCESSORY_CONFIG.deload :
    cycleType === 'hypertrophy' ? ACCESSORY_CONFIG.hypertrophy : ACCESSORY_CONFIG.strength;

  const numAccessories = isDeload ? 1 : 2;

  return accessories.slice(0, numAccessories).map((name) => ({
    name,
    type: 'accessory' as const,
    isToolExercise: true,
    sets: Array(config.sets).fill({ reps: 8, percentage: 0, rpe: 7 }),
    notes: `${config.sets} x ${config.reps}`,
  }));
}

function generateDay(
  dayNumber: number,
  primaryLift: 'squat' | 'bench' | 'deadlift',
  secondaryLift: 'squat' | 'bench' | 'deadlift',
  maxes: Maxes,
  weekSets: { heavy: SetPrescription[]; light: SetPrescription[] },
  cycleType: CycleType,
  isDeload: boolean
): DayPrescription {
  const liftNames = {
    squat: 'Squat',
    bench: 'Bench Press',
    deadlift: 'Deadlift',
  };

  const primaryExercise: ExercisePrescription = {
    name: liftNames[primaryLift],
    type: primaryLift,
    sets: weekSets.heavy.map((set) => ({
      ...set,
      weight: calculateWorkingWeight(maxes[primaryLift], set.percentage),
    })),
  };

  const secondaryExercise: ExercisePrescription = {
    name: liftNames[secondaryLift],
    type: secondaryLift,
    sets: weekSets.light.map((set) => ({
      ...set,
      weight: calculateWorkingWeight(maxes[secondaryLift], set.percentage),
    })),
  };

  const accessories = generateAccessories(primaryLift, cycleType, isDeload);

  return {
    dayNumber,
    name: `Jour ${dayNumber} - ${liftNames[primaryLift]} + ${liftNames[secondaryLift]}`,
    mainLift: primaryLift,
    exercises: [primaryExercise, secondaryExercise, ...accessories],
  };
}

function generateWeek(
  weekNumber: number,
  maxes: Maxes,
  cycleType: CycleType,
  duration: number
): WeekPrescription {
  const isDeload = (cycleType === '531' && weekNumber === 4) ||
                   (cycleType === 'block' && weekNumber === 8);
  const weekSets = getWeekSets(cycleType, weekNumber);

  // Each lift appears 2x per week: once as primary (heavy), once as secondary (light)
  // Day 1: Squat (heavy) + Bench (light)
  // Day 2: Bench (heavy) + Deadlift (light)
  // Day 3: Deadlift (heavy) + Squat (light)
  const days: DayPrescription[] = [
    generateDay(1, 'squat', 'bench', maxes, weekSets, cycleType, isDeload),
    generateDay(2, 'bench', 'deadlift', maxes, weekSets, cycleType, isDeload),
    generateDay(3, 'deadlift', 'squat', maxes, weekSets, cycleType, isDeload),
  ];

  return {
    weekNumber,
    name: getWeekName(cycleType, weekNumber, duration),
    isDeload,
    days,
    focus: getWeekFocus(cycleType, weekNumber),
  };
}

function getCycleDescription(cycleType: CycleType): string {
  switch (cycleType) {
    case '531':
      return 'Programme 5/3/1 adapté. Chaque lift 2x/semaine (1 lourd + 1 léger). Progression sur 4 semaines avec déload.';
    case 'linear':
      return 'Périodisation linéaire sur 6 semaines. Du volume vers l\'intensité maximale. Semaine 6 = test de nouveaux PRs.';
    case 'hypertrophy':
      return 'Programme hypertrophie 4 semaines. Volume élevé pour la croissance musculaire.';
    case 'block':
      return 'Périodisation par blocs 8 semaines: Accumulation → Intensification → Peaking vers de nouveaux PRs.';
    default:
      return '';
  }
}

function getExpectedProgress(cycleType: CycleType): { squat: number; bench: number; deadlift: number } {
  switch (cycleType) {
    case '531':
      return { squat: 5, bench: 2.5, deadlift: 5 };
    case 'linear':
      return { squat: 5, bench: 2.5, deadlift: 5 };
    case 'hypertrophy':
      return { squat: 2.5, bench: 2.5, deadlift: 2.5 };
    case 'block':
      return { squat: 7.5, bench: 5, deadlift: 7.5 };
    default:
      return { squat: 5, bench: 2.5, deadlift: 5 };
  }
}

function getReasonings(profile: UserProfile, cycleType: CycleType): string[] {
  const reasons: string[] = [];

  reasons.push('Chaque mouvement est travaillé 2x/semaine (1 session lourde + 1 session légère).');

  if (cycleType === 'linear') {
    reasons.push('Progression linéaire de 72.5% à 102.5% de ton max sur 6 semaines.');
    reasons.push('Semaine 6: test de nouveaux PRs avec charges supérieures à ton max actuel.');
  }

  if (cycleType === '531') {
    reasons.push('Le 5/3/1 est idéal pour ton niveau avec une progression durable.');
    reasons.push('AMRAP sur le dernier set pour pousser au-delà des prescriptions.');
  }

  if (cycleType === 'block') {
    reasons.push('Périodisation avancée: accumulation de volume puis montée en intensité.');
    reasons.push('Semaine 7: peaking vers 102.5% pour battre tes PRs.');
  }

  reasons.push('Les exercices "outils" sont suggérés mais optionnels - pas de tracking de performance.');

  return reasons;
}

export function generateProgram(profile: UserProfile): ProgramRecommendation {
  const cycleType = determineBestCycleType(profile);
  const goal = determineGoal(profile);
  const duration = getCycleDuration(cycleType);

  // Use actual 1RMs directly (not 90% training max)
  const maxes: Maxes = {
    squat: profile.currentMaxes.squat,
    bench: profile.currentMaxes.bench,
    deadlift: profile.currentMaxes.deadlift,
  };

  const weeks: WeekPrescription[] = [];
  for (let i = 1; i <= duration; i++) {
    weeks.push(generateWeek(i, maxes, cycleType, duration));
  }

  const program: GeneratedProgram = {
    name: getCycleName(cycleType),
    type: cycleType,
    goal,
    duration,
    maxes,
    weeks,
    createdAt: new Date(),
    description: getCycleDescription(cycleType),
  };

  return {
    program,
    reasoning: getReasonings(profile, cycleType),
    expectedProgress: getExpectedProgress(cycleType),
  };
}

function getCycleName(cycleType: CycleType): string {
  switch (cycleType) {
    case '531':
      return 'Programme 5/3/1';
    case 'linear':
      return 'Progression Linéaire 6 Semaines';
    case 'hypertrophy':
      return 'Hypertrophie';
    case 'block':
      return 'Périodisation par Blocs';
    default:
      return 'Programme Personnalisé';
  }
}

export function formatSetDisplay(set: SetPrescription & { weight?: number }): string {
  const weightStr = set.weight ? `${set.weight}kg` : `${set.percentage}%`;
  const amrapStr = set.amrap ? '+' : '';
  return `${set.reps}${amrapStr} @ ${weightStr}`;
}

export function formatWeekSummary(week: WeekPrescription): string {
  if (week.isDeload) return 'Semaine légère - Récupération';
  const mainSets = week.days[0]?.exercises[0]?.sets || [];
  if (mainSets.length === 0) return '';
  const topWeight = mainSets[mainSets.length - 1]?.weight || 0;
  const topPercentage = mainSets[mainSets.length - 1]?.percentage || 0;
  return `Max: ${topWeight}kg (${topPercentage}%)`;
}
