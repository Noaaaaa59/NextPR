import { StrengthLevel } from '@/types/analytics';
import { Experience, PriorityLift } from '@/types/user';
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
  WEEK_531_EXTENDED,
  WEEK_LINEAR,
  WEEK_HYPERTROPHY,
  WEEK_BLOCK,
  ACCESSORY_CONFIG,
  ACCESSORIES_BY_LIFT,
  calculateWorkingWeight,
  calculateWorkingWeight531,
  calculateTrainingMax,
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
  daysPerWeek: 3 | 4 | 5;
  durationWeeks: 4 | 6;
  priorityLift: PriorityLift;
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

function getCycleDuration(cycleType: CycleType, userDuration?: 4 | 6): number {
  if (userDuration) {
    return userDuration;
  }
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

type Lift = 'squat' | 'bench' | 'deadlift';

interface DaySplit {
  primary: Lift;
  secondary: Lift;
}

function getDaySplits(daysPerWeek: 3 | 4 | 5, priorityLift: PriorityLift): DaySplit[] {
  const lifts: Lift[] = ['squat', 'bench', 'deadlift'];
  const otherLifts = lifts.filter(l => l !== priorityLift);

  const baseSplit: DaySplit[] = [
    { primary: 'squat', secondary: 'bench' },
    { primary: 'bench', secondary: 'deadlift' },
    { primary: 'deadlift', secondary: 'squat' },
  ];

  if (daysPerWeek === 3) {
    return baseSplit;
  }

  if (daysPerWeek === 4) {
    return [
      ...baseSplit,
      { primary: priorityLift, secondary: otherLifts[0] },
    ];
  }

  if (daysPerWeek === 5) {
    return [
      ...baseSplit,
      { primary: priorityLift, secondary: otherLifts[0] },
      { primary: priorityLift, secondary: otherLifts[1] },
    ];
  }

  return baseSplit;
}

interface WeekSetsResult {
  heavy: SetPrescription[];
  light: SetPrescription[];
  bbb?: SetPrescription[];
}

function getWeekSets(cycleType: CycleType, weekNumber: number, duration: number = 4): WeekSetsResult {
  switch (cycleType) {
    case '531':
      if (duration === 6) {
        return WEEK_531_EXTENDED[weekNumber] || WEEK_531_EXTENDED[1];
      }
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
  const isDeload = (duration === 4 && weekNumber === 4) ||
                   (duration === 6 && weekNumber === 6);

  if (isDeload) {
    return `Semaine ${weekNumber} - Déload`;
  }

  if (cycleType === '531') {
    if (duration === 4) {
      const names531 = ['5s (5 reps)', '3s (3 reps)', '5/3/1 (PR)'];
      return `Semaine ${weekNumber} - ${names531[weekNumber - 1] || '5/3/1'}`;
    }
    if (duration === 6) {
      const names531_6 = ['5s', '3s', '5/3/1', '5s+', '3s+'];
      return `Semaine ${weekNumber} - ${names531_6[weekNumber - 1] || '5/3/1'}`;
    }
  }

  if (duration === 4) {
    const names = ['Volume', 'Force', 'Peak'];
    return `Semaine ${weekNumber} - ${names[weekNumber - 1] || 'Force'}`;
  }

  if (duration === 6) {
    if (weekNumber <= 2) return `Semaine ${weekNumber} - Volume`;
    if (weekNumber <= 4) return `Semaine ${weekNumber} - Force`;
    if (weekNumber === 5) return `Semaine ${weekNumber} - Peak`;
    return `Semaine ${weekNumber} - Test PR`;
  }

  return `Semaine ${weekNumber}`;
}

function getWeekFocus(cycleType: CycleType, weekNumber: number, duration: number): string {
  if (cycleType === '531') {
    const focus531_4 = [
      '3x5 @ 65-75-85% TM - AMRAP sur le dernier set (vise 8+ reps)',
      '3x3 @ 70-80-90% TM - AMRAP sur le dernier set (vise 5+ reps)',
      '5/3/1 @ 75-85-95% TM - AMRAP sur le dernier set (vise 3+ reps)',
      'Récupération active - charges légères',
    ];
    const focus531_6 = [
      '3x5 @ 65-75-85% TM - AMRAP (vise 8+ reps)',
      '3x3 @ 70-80-90% TM - AMRAP (vise 5+ reps)',
      '5/3/1 @ 75-85-95% TM - AMRAP (vise 3+ reps)',
      '3x5 @ 67.5-77.5-87.5% TM - Cycle 2',
      '3x3 @ 72.5-82.5-92.5% TM - Cycle 2',
      'Récupération active - Déload',
    ];
    return duration === 6 ? focus531_6[weekNumber - 1] || '' : focus531_4[weekNumber - 1] || '';
  }

  const focus4Weeks = [
    'Volume modéré, construire la base',
    'Intensité augmentée, moins de reps',
    'Semaine de test, AMRAP sur le dernier set',
    'Récupération active - Déload',
  ];

  const focus6Weeks = [
    'Volume élevé, adaptation musculaire',
    'Volume élevé, adaptation musculaire',
    'Transition vers la force',
    'Charges plus lourdes',
    'Peak d\'intensité, préparation au max',
    'Test de nouveaux PRs - donne tout !',
  ];

  if (weekNumber <= 4) {
    return focus4Weeks[weekNumber - 1] || '';
  }
  if (weekNumber <= 6) {
    return focus6Weeks[weekNumber - 1] || '';
  }
  return '';
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
  weekSets: WeekSetsResult,
  cycleType: CycleType,
  isDeload: boolean
): DayPrescription {
  const liftNames = {
    squat: 'Squat',
    bench: 'Bench Press',
    deadlift: 'Deadlift',
  };

  const is531 = cycleType === '531';
  const calcWeight = is531 ? calculateWorkingWeight531 : calculateWorkingWeight;

  const primaryExercise: ExercisePrescription = {
    name: liftNames[primaryLift],
    type: primaryLift,
    sets: weekSets.heavy.map((set) => ({
      ...set,
      weight: calcWeight(maxes[primaryLift], set.percentage),
    })),
  };

  const secondaryExercise: ExercisePrescription = {
    name: liftNames[secondaryLift],
    type: secondaryLift,
    sets: weekSets.light.map((set) => ({
      ...set,
      weight: calcWeight(maxes[secondaryLift], set.percentage),
    })),
  };

  const exercises: ExercisePrescription[] = [primaryExercise, secondaryExercise];

  if (is531 && weekSets.bbb && !isDeload) {
    const bbbExercise: ExercisePrescription = {
      name: `${liftNames[primaryLift]} (BBB)`,
      type: primaryLift,
      isToolExercise: true,
      sets: weekSets.bbb.map((set) => ({
        ...set,
        weight: calcWeight(maxes[primaryLift], set.percentage),
      })),
      notes: 'Boring But Big - 5x10 @ 50% TM',
    };
    exercises.push(bbbExercise);
  }

  const accessories = generateAccessories(primaryLift, cycleType, isDeload);
  exercises.push(...accessories);

  return {
    dayNumber,
    name: `Jour ${dayNumber} - ${liftNames[primaryLift]} + ${liftNames[secondaryLift]}`,
    mainLift: primaryLift,
    exercises,
  };
}

function generateWeek(
  weekNumber: number,
  maxes: Maxes,
  cycleType: CycleType,
  duration: number,
  daysPerWeek: 3 | 4 | 5 = 3,
  priorityLift: PriorityLift = 'squat'
): WeekPrescription {
  const isDeload = (duration === 4 && weekNumber === 4) ||
                   (duration === 6 && weekNumber === 6);
  const adjustedWeekNumber = getAdjustedWeekNumber(weekNumber, duration, cycleType);
  const weekSets = getWeekSets(cycleType, adjustedWeekNumber, duration);

  const daySplits = getDaySplits(daysPerWeek, priorityLift);

  const days: DayPrescription[] = daySplits.map((split, index) => {
    const isExtraDay = index >= 3;
    return generateDay(
      index + 1,
      split.primary,
      split.secondary,
      maxes,
      isExtraDay ? getMediumSets(weekSets) : weekSets,
      cycleType,
      isDeload
    );
  });

  return {
    weekNumber,
    name: getWeekName(cycleType, weekNumber, duration),
    isDeload,
    days,
    focus: getWeekFocus(cycleType, weekNumber, duration),
  };
}

function getAdjustedWeekNumber(weekNumber: number, duration: number, cycleType: CycleType): number {
  if (duration === 4) {
    return weekNumber;
  }
  if (duration === 6) {
    if (weekNumber <= 2) return 1;
    if (weekNumber <= 4) return 2;
    if (weekNumber === 5) return 3;
    return 4;
  }
  return weekNumber;
}

function getMediumSets(weekSets: { heavy: SetPrescription[]; light: SetPrescription[] }): { heavy: SetPrescription[]; light: SetPrescription[] } {
  return {
    heavy: weekSets.light.map(set => ({
      ...set,
      percentage: Math.min(set.percentage + 5, 80),
    })),
    light: weekSets.light,
  };
}

function getCycleDescription(cycleType: CycleType, daysPerWeek: number = 3, priorityLift: PriorityLift = 'squat'): string {
  const liftNames = { squat: 'Squat', bench: 'Bench', deadlift: 'Deadlift' };
  const priorityName = liftNames[priorityLift];
  const extraDays = daysPerWeek > 3 ? ` Focus ${priorityName} avec ${daysPerWeek - 3} jour(s) supplémentaire(s).` : '';

  switch (cycleType) {
    case '531':
      return `Programme 5/3/1 de Jim Wendler avec BBB (Boring But Big). Basé sur le Training Max (90% du 1RM). ${daysPerWeek} jours/semaine.${extraDays}`;
    case 'linear':
      return `Périodisation linéaire. Du volume vers l'intensité maximale. ${daysPerWeek} jours/semaine.${extraDays}`;
    case 'hypertrophy':
      return `Programme hypertrophie. Volume élevé pour la croissance. ${daysPerWeek} jours/semaine.${extraDays}`;
    case 'block':
      return `Périodisation par blocs: Accumulation → Intensification → Peaking. ${daysPerWeek} jours/semaine.${extraDays}`;
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

function getReasonings(profile: UserProfile, cycleType: CycleType, daysPerWeek: number = 3, priorityLift: PriorityLift = 'squat'): string[] {
  const reasons: string[] = [];
  const liftNames = { squat: 'Squat', bench: 'Bench', deadlift: 'Deadlift' };

  if (daysPerWeek === 3) {
    reasons.push('Chaque mouvement est travaillé 2x/semaine (1 session lourde + 1 session légère).');
  } else if (daysPerWeek === 4) {
    reasons.push(`${liftNames[priorityLift]} travaillé 3x/semaine, les autres 2x/semaine.`);
  } else {
    reasons.push(`${liftNames[priorityLift]} travaillé 4x/semaine pour un focus maximal.`);
  }

  if (cycleType === 'linear') {
    reasons.push('Progression linéaire de 72.5% à 102.5% de ton max.');
    reasons.push('Dernière semaine: test de nouveaux PRs.');
  }

  if (cycleType === '531') {
    reasons.push('Training Max = 90% de ton 1RM pour une progression durable.');
    reasons.push('AMRAP sur le dernier set - ne va pas à l\'échec, garde 1-2 reps en réserve.');
    reasons.push('BBB (5x10 @ 50%) pour le volume et l\'hypertrophie.');
    reasons.push('Progression: +2.5kg upper body, +5kg lower body par cycle.');
  }

  if (cycleType === 'block') {
    reasons.push('Périodisation avancée: accumulation de volume puis montée en intensité.');
  }

  reasons.push('Les exercices "outils" sont suggérés mais optionnels - pas de tracking.');

  return reasons;
}

export function generateProgram(profile: UserProfile): ProgramRecommendation {
  const cycleType = determineBestCycleType(profile);
  const goal = determineGoal(profile);
  const duration = profile.durationWeeks || getCycleDuration(cycleType);
  const daysPerWeek = profile.daysPerWeek || 3;
  const priorityLift = profile.priorityLift || 'squat';

  const maxes: Maxes = {
    squat: profile.currentMaxes.squat,
    bench: profile.currentMaxes.bench,
    deadlift: profile.currentMaxes.deadlift,
  };

  const weeks: WeekPrescription[] = [];
  for (let i = 1; i <= duration; i++) {
    weeks.push(generateWeek(i, maxes, cycleType, duration, daysPerWeek, priorityLift));
  }

  const program: GeneratedProgram = {
    name: getCycleName(cycleType, duration, daysPerWeek),
    type: cycleType,
    goal,
    duration,
    maxes,
    weeks,
    createdAt: new Date(),
    description: getCycleDescription(cycleType, daysPerWeek, priorityLift),
  };

  return {
    program,
    reasoning: getReasonings(profile, cycleType, daysPerWeek, priorityLift),
    expectedProgress: getExpectedProgress(cycleType),
  };
}

function getCycleName(cycleType: CycleType, duration: number = 4, daysPerWeek: number = 3): string {
  const base = (() => {
    switch (cycleType) {
      case '531':
        return '5/3/1';
      case 'linear':
        return 'Linéaire';
      case 'hypertrophy':
        return 'Hypertrophie';
      case 'block':
        return 'Blocs';
      default:
        return 'Personnalisé';
    }
  })();
  return `${base} ${duration}S - ${daysPerWeek}J/sem`;
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
