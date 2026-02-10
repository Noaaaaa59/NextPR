import { Experience, PriorityLift, ProgramType } from '@/types/user';
import {
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
  LINEAR_SETS,
  calculateWorkingWeight,
  calculateWorkingWeight531,
} from './percentages';

interface UserProfile {
  experience: Experience;
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
  trainingMaxPercentage?: number;
  programType?: ProgramType;
}

interface Maxes {
  squat: number;
  bench: number;
  deadlift: number;
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
  useTrainingMax?: boolean;
  isDeload?: boolean;
  isTestWeek?: boolean;
}

function getWeekSets(weekNumber: number, duration: number = 4): WeekSetsResult {
  if (duration === 6) {
    return WEEK_531_EXTENDED[weekNumber] || WEEK_531_EXTENDED[1];
  }
  return WEEK_531[weekNumber] || WEEK_531[1];
}

function getWeekName(weekNumber: number, duration: number): string {
  if (duration === 4) {
    const names = ['5s (Volume)', '3s (Force)', '5/3/1 (Intensité)', 'TEST PR 🎯'];
    return `Semaine ${weekNumber} - ${names[weekNumber - 1] || '5/3/1'}`;
  }
  if (duration === 6) {
    const names = ['5s (Volume)', '3s (Force)', '5/3/1', '5s (Cycle 2)', '3s (Cycle 2)', 'TEST PR 🎯'];
    return `Semaine ${weekNumber} - ${names[weekNumber - 1] || '5/3/1'}`;
  }
  return `Semaine ${weekNumber}`;
}

function getWeekFocus(weekNumber: number, duration: number): string {
  const focus4 = [
    '3x5 @ 65-85% - AMRAP sur le dernier set. Construire le volume.',
    '3x3 @ 70-90% - AMRAP sur le dernier set. Force maximale.',
    '5/3/1 @ 75-95% - AMRAP sur le dernier set. Semaine la plus intense.',
    '🎯 TEST DE PR - Singles montants jusqu\'à 102.5% pour battre ton record!',
  ];
  const focus6 = [
    '3x5 @ 65-85% - AMRAP sur le dernier set. Début du cycle 1.',
    '3x3 @ 70-90% - AMRAP sur le dernier set. Force maximale.',
    '5/3/1 @ 75-95% - AMRAP sur le dernier set. Fin du cycle 1.',
    '3x5 @ 65-85% - AMRAP sur le dernier set. Début du cycle 2.',
    '3x3 @ 70-90% - AMRAP sur le dernier set. Force maximale.',
    '🎯 TEST DE PR - Singles montants jusqu\'à 102.5% pour battre ton record!',
  ];
  return duration === 6 ? focus6[weekNumber - 1] || '' : focus4[weekNumber - 1] || '';
}

function generateDay(
  dayNumber: number,
  primaryLift: Lift,
  secondaryLift: Lift,
  maxes: Maxes,
  weekSets: WeekSetsResult,
  isDeload: boolean,
  tmPercentage: number = 90
): DayPrescription {
  const liftNames = {
    squat: 'Squat',
    bench: 'Bench Press',
    deadlift: 'Deadlift',
  };

  // Use actual 1RM for test weeks, otherwise use training max calculation
  const calcWeight = weekSets.useTrainingMax !== false
    ? (max: number, pct: number) => calculateWorkingWeight531(max, pct, tmPercentage)
    : calculateWorkingWeight;

  // PR increment: +2.5kg for bench, +5kg for squat/deadlift
  const getPRWeight = (lift: Lift, max: number) => {
    const increment = lift === 'bench' ? 2.5 : 5;
    return max + increment;
  };

  const primaryExercise: ExercisePrescription = {
    name: liftNames[primaryLift],
    type: primaryLift,
    sets: weekSets.heavy.map((set) => ({
      ...set,
      weight: set.percentage === 0
        ? getPRWeight(primaryLift, maxes[primaryLift]) // PR attempt
        : calcWeight(maxes[primaryLift], set.percentage),
    })),
  };

  const secondaryExercise: ExercisePrescription = {
    name: liftNames[secondaryLift],
    type: secondaryLift,
    sets: weekSets.light.map((set) => ({
      ...set,
      weight: set.percentage === 0
        ? getPRWeight(secondaryLift, maxes[secondaryLift])
        : calcWeight(maxes[secondaryLift], set.percentage),
    })),
  };

  const exercises: ExercisePrescription[] = [primaryExercise, secondaryExercise];

  // Ajouter BBB (Boring But Big) si disponible et pas en déload/test
  if (weekSets.bbb && !isDeload && !weekSets.isTestWeek) {
    const bbbExercise: ExercisePrescription = {
      name: `${liftNames[primaryLift]} (BBB)`,
      type: primaryLift,
      isToolExercise: true,
      sets: weekSets.bbb.map((set) => ({
        ...set,
        weight: calculateWorkingWeight531(maxes[primaryLift], set.percentage, tmPercentage),
      })),
      notes: 'Boring But Big - 5x10 @ 50%',
    };
    exercises.push(bbbExercise);
  }

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
  duration: number,
  daysPerWeek: 3 | 4 | 5 = 3,
  priorityLift: PriorityLift = 'squat',
  tmPercentage: number = 90
): WeekPrescription {
  const weekSets = getWeekSets(weekNumber, duration);
  const isDeload = weekSets.isDeload || false;
  const daySplits = getDaySplits(daysPerWeek, priorityLift);

  const days: DayPrescription[] = daySplits.map((split, index) => {
    const isExtraDay = index >= 3;
    return generateDay(
      index + 1,
      split.primary,
      split.secondary,
      maxes,
      isExtraDay ? getMediumSets(weekSets) : weekSets,
      isDeload,
      tmPercentage
    );
  });

  return {
    weekNumber,
    name: getWeekName(weekNumber, duration),
    isDeload,
    days,
    focus: getWeekFocus(weekNumber, duration),
  };
}

function getMediumSets(weekSets: WeekSetsResult): WeekSetsResult {
  return {
    ...weekSets,
    heavy: weekSets.light.map(set => ({
      ...set,
      percentage: Math.min(set.percentage + 5, 80),
    })),
  };
}

function getCycleDescription(daysPerWeek: number = 3, priorityLift: PriorityLift = 'squat', tmPercentage: number = 90): string {
  const liftNames = { squat: 'Squat', bench: 'Bench', deadlift: 'Deadlift' };
  const priorityName = liftNames[priorityLift];
  const extraDays = daysPerWeek > 3 ? ` Focus ${priorityName} avec ${daysPerWeek - 3} jour(s) supplémentaire(s).` : '';

  return `Programme 5/3/1 de Jim Wendler avec BBB (Boring But Big). Basé sur le Training Max (${tmPercentage}% du 1RM). ${daysPerWeek} jours/semaine.${extraDays}`;
}

function getReasonings(daysPerWeek: number = 3, priorityLift: PriorityLift = 'squat', tmPercentage: number = 90): string[] {
  const reasons: string[] = [];
  const liftNames = { squat: 'Squat', bench: 'Bench', deadlift: 'Deadlift' };

  if (daysPerWeek === 3) {
    reasons.push('Chaque mouvement est travaillé 2x/semaine (1 session lourde + 1 session légère).');
  } else if (daysPerWeek === 4) {
    reasons.push(`${liftNames[priorityLift]} travaillé 3x/semaine, les autres 2x/semaine.`);
  } else {
    reasons.push(`${liftNames[priorityLift]} travaillé 4x/semaine pour un focus maximal.`);
  }

  reasons.push(`Basé sur le Training Max (${tmPercentage}% du 1RM) pour garantir une progression durable.`);
  reasons.push('AMRAP sur les sets clés - ne va pas à l\'échec, garde 1-2 reps en réserve.');
  reasons.push('BBB (5x10 @ 50%) pour le volume d\'hypertrophie.');
  reasons.push('Progression: +5kg squat/deadlift, +2.5kg bench par cycle de 4 semaines.');

  return reasons;
}

// === Linéaire: Heavy/Medium/Light rotation ===

const LINEAR_DAY_SPLITS: { heavy: Lift; medium: Lift; light: Lift }[] = [
  { heavy: 'bench', medium: 'deadlift', light: 'squat' },   // Jour A
  { heavy: 'squat', medium: 'bench', light: 'deadlift' },   // Jour B
  { heavy: 'deadlift', medium: 'squat', light: 'bench' },   // Jour C
];

function generateLinearDay(
  dayIndex: number,
  maxes: Maxes,
  tmPercentage: number = 90
): DayPrescription {
  const liftNames: Record<Lift, string> = {
    squat: 'Squat',
    bench: 'Bench Press',
    deadlift: 'Deadlift',
  };

  const split = LINEAR_DAY_SPLITS[dayIndex];
  const intensities: ('heavy' | 'medium' | 'light')[] = ['heavy', 'medium', 'light'];
  const dayLabel = ['A', 'B', 'C'][dayIndex];

  const exercises: ExercisePrescription[] = intensities.map((intensity) => {
    const lift = split[intensity];
    return {
      name: liftNames[lift],
      type: lift,
      sets: LINEAR_SETS[intensity].map((set) => ({
        ...set,
        weight: calculateWorkingWeight531(maxes[lift], set.percentage, tmPercentage),
      })),
      notes: intensity === 'heavy' ? '3x1 @ 95% TM'
        : intensity === 'medium' ? '3x3 @ 90% TM'
        : '5x5 @ 80% TM',
    };
  });

  return {
    dayNumber: dayIndex + 1,
    name: `Jour ${dayLabel} - ${liftNames[split.heavy]} + ${liftNames[split.medium]} + ${liftNames[split.light]}`,
    mainLift: split.heavy,
    exercises,
  };
}

function generateLinearWeek(
  weekNumber: number,
  duration: number,
  maxes: Maxes,
  tmPercentage: number = 90
): WeekPrescription {
  const isLastWeek = weekNumber === duration;

  if (isLastWeek) {
    // TEST PR week: reuse 5/3/1 test week logic with 3-day split
    const weekSets = getWeekSets(duration, duration);
    const daySplits = getDaySplits(3, 'squat');
    const days: DayPrescription[] = daySplits.map((split, index) =>
      generateDay(index + 1, split.primary, split.secondary, maxes, weekSets, false, tmPercentage)
    );
    return {
      weekNumber,
      name: `Semaine ${weekNumber} - TEST PR 🎯`,
      isDeload: false,
      days,
      focus: '🎯 TEST DE PR - Singles montants jusqu\'à 102.5% pour battre ton record!',
    };
  }

  const days: DayPrescription[] = [0, 1, 2].map((i) =>
    generateLinearDay(i, maxes, tmPercentage)
  );

  return {
    weekNumber,
    name: `Semaine ${weekNumber} - Linéaire`,
    isDeload: false,
    days,
    focus: 'Heavy (3x1 @ 95%) / Medium (3x3 @ 90%) / Light (5x5 @ 80%) - Rotation des 3 lifts.',
  };
}

function getLinearDescription(tmPercentage: number = 90): string {
  return `Programme Linéaire Heavy/Medium/Light. Basé sur le Training Max (${tmPercentage}% du 1RM). 3 jours/semaine avec rotation des 3 lifts à intensités différentes.`;
}

function getLinearReasonings(tmPercentage: number = 90): string[] {
  return [
    'Chaque lift est travaillé 3x/semaine à des intensités différentes (Heavy, Medium, Light).',
    `Basé sur le Training Max (${tmPercentage}% du 1RM) pour garantir une progression durable.`,
    'Heavy (3x1 @ 95% TM) pour la force maximale, Medium (3x3 @ 90% TM) pour la puissance, Light (5x5 @ 80% TM) pour le volume.',
    'Progression: +5kg squat/deadlift, +2.5kg bench par cycle.',
  ];
}

export function generateProgram(profile: UserProfile): ProgramRecommendation {
  const programType = profile.programType || '531';
  const duration = profile.durationWeeks || 4;
  const tmPercentage = profile.trainingMaxPercentage || 90;

  const maxes: Maxes = {
    squat: profile.currentMaxes.squat,
    bench: profile.currentMaxes.bench,
    deadlift: profile.currentMaxes.deadlift,
  };

  if (programType === 'linear') {
    const weeks: WeekPrescription[] = [];
    for (let i = 1; i <= duration; i++) {
      weeks.push(generateLinearWeek(i, duration, maxes, tmPercentage));
    }

    const program: GeneratedProgram = {
      name: `Linéaire ${duration}S`,
      type: 'linear',
      goal: 'strength',
      duration,
      maxes,
      weeks,
      createdAt: new Date(),
      description: getLinearDescription(tmPercentage),
    };

    return {
      program,
      reasoning: getLinearReasonings(tmPercentage),
      expectedProgress: { squat: 5, bench: 2.5, deadlift: 5 },
    };
  }

  // 5/3/1
  const daysPerWeek = profile.daysPerWeek || 3;
  const priorityLift = profile.priorityLift || 'squat';

  const weeks: WeekPrescription[] = [];
  for (let i = 1; i <= duration; i++) {
    weeks.push(generateWeek(i, maxes, duration, daysPerWeek, priorityLift, tmPercentage));
  }

  const program: GeneratedProgram = {
    name: `5/3/1 ${duration}S - ${daysPerWeek}J/sem`,
    type: '531',
    goal: 'strength',
    duration,
    maxes,
    weeks,
    createdAt: new Date(),
    description: getCycleDescription(daysPerWeek, priorityLift, tmPercentage),
  };

  return {
    program,
    reasoning: getReasonings(daysPerWeek, priorityLift, tmPercentage),
    expectedProgress: { squat: 5, bench: 2.5, deadlift: 5 },
  };
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
