import { Experience, PriorityLift } from '@/types/user';
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
}

function getWeekSets(weekNumber: number, duration: number = 4): WeekSetsResult {
  if (duration === 6) {
    return WEEK_531_EXTENDED[weekNumber] || WEEK_531_EXTENDED[1];
  }
  return WEEK_531[weekNumber] || WEEK_531[1];
}

function getWeekName(weekNumber: number, duration: number): string {
  if (duration === 4) {
    const names = ['5s (Volume)', '3s (Force)', '5/3/1 (Intensité)', 'Déload 😴'];
    return `Semaine ${weekNumber} - ${names[weekNumber - 1] || '5/3/1'}`;
  }
  if (duration === 6) {
    const names = ['5s (Volume)', '3s (Force)', '5/3/1', '5s (Cycle 2)', '3s (Cycle 2)', '5/3/1 (Final)'];
    return `Semaine ${weekNumber} - ${names[weekNumber - 1] || '5/3/1'}`;
  }
  return `Semaine ${weekNumber}`;
}

function getWeekFocus(weekNumber: number, duration: number): string {
  const focus4 = [
    '3x5 @ 65-85% TM - AMRAP sur le dernier set. Construire le volume.',
    '3x3 @ 70-90% TM - AMRAP sur le dernier set. Force maximale.',
    '5/3/1 @ 75-95% TM - AMRAP sur le dernier set. Semaine la plus intense.',
    '😴 Déload @ 40-60% TM. Récupération active pour le prochain cycle.',
  ];
  const focus6 = [
    '3x5 @ 65-85% TM - AMRAP sur le dernier set. Début du cycle 1.',
    '3x3 @ 70-90% TM - AMRAP sur le dernier set. Force maximale.',
    '5/3/1 @ 75-95% TM - AMRAP sur le dernier set. Fin du cycle 1.',
    '3x5 @ 65-85% TM - AMRAP sur le dernier set. Début du cycle 2 (+2.5/5kg TM).',
    '3x3 @ 70-90% TM - AMRAP sur le dernier set. Force maximale.',
    '5/3/1 @ 75-95% TM - AMRAP sur le dernier set. Fin du programme.',
  ];
  return duration === 6 ? focus6[weekNumber - 1] || '' : focus4[weekNumber - 1] || '';
}

function generateDay(
  dayNumber: number,
  primaryLift: Lift,
  secondaryLift: Lift,
  maxes: Maxes,
  weekSets: WeekSetsResult,
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
      weight: calculateWorkingWeight531(maxes[primaryLift], set.percentage),
    })),
  };

  const secondaryExercise: ExercisePrescription = {
    name: liftNames[secondaryLift],
    type: secondaryLift,
    sets: weekSets.light.map((set) => ({
      ...set,
      weight: calculateWorkingWeight531(maxes[secondaryLift], set.percentage),
    })),
  };

  const exercises: ExercisePrescription[] = [primaryExercise, secondaryExercise];

  // Ajouter BBB (Boring But Big) si disponible et pas en déload
  if (weekSets.bbb && !isDeload) {
    const bbbExercise: ExercisePrescription = {
      name: `${liftNames[primaryLift]} (BBB)`,
      type: primaryLift,
      isToolExercise: true,
      sets: weekSets.bbb.map((set) => ({
        ...set,
        weight: calculateWorkingWeight531(maxes[primaryLift], set.percentage),
      })),
      notes: 'Boring But Big - 5x10 @ 50% TM',
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
  priorityLift: PriorityLift = 'squat'
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
      isDeload
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

function getCycleDescription(daysPerWeek: number = 3, priorityLift: PriorityLift = 'squat'): string {
  const liftNames = { squat: 'Squat', bench: 'Bench', deadlift: 'Deadlift' };
  const priorityName = liftNames[priorityLift];
  const extraDays = daysPerWeek > 3 ? ` Focus ${priorityName} avec ${daysPerWeek - 3} jour(s) supplémentaire(s).` : '';

  return `Programme 5/3/1 de Jim Wendler avec BBB (Boring But Big). Basé sur le Training Max (90% du 1RM). ${daysPerWeek} jours/semaine.${extraDays}`;
}

function getReasonings(daysPerWeek: number = 3, priorityLift: PriorityLift = 'squat'): string[] {
  const reasons: string[] = [];
  const liftNames = { squat: 'Squat', bench: 'Bench', deadlift: 'Deadlift' };

  if (daysPerWeek === 3) {
    reasons.push('Chaque mouvement est travaillé 2x/semaine (1 session lourde + 1 session légère).');
  } else if (daysPerWeek === 4) {
    reasons.push(`${liftNames[priorityLift]} travaillé 3x/semaine, les autres 2x/semaine.`);
  } else {
    reasons.push(`${liftNames[priorityLift]} travaillé 4x/semaine pour un focus maximal.`);
  }

  reasons.push('Basé sur le Training Max (90% du 1RM) pour garantir une progression durable.');
  reasons.push('AMRAP sur les sets clés - ne va pas à l\'échec, garde 1-2 reps en réserve.');
  reasons.push('BBB (5x10 @ 50%) pour le volume d\'hypertrophie.');
  reasons.push('Progression: +5kg squat/deadlift, +2.5kg bench par cycle de 4 semaines.');

  return reasons;
}

export function generateProgram(profile: UserProfile): ProgramRecommendation {
  const cycleType: CycleType = '531';
  const duration = profile.durationWeeks || 4;
  const daysPerWeek = profile.daysPerWeek || 3;
  const priorityLift = profile.priorityLift || 'squat';

  const maxes: Maxes = {
    squat: profile.currentMaxes.squat,
    bench: profile.currentMaxes.bench,
    deadlift: profile.currentMaxes.deadlift,
  };

  const weeks: WeekPrescription[] = [];
  for (let i = 1; i <= duration; i++) {
    weeks.push(generateWeek(i, maxes, duration, daysPerWeek, priorityLift));
  }

  const program: GeneratedProgram = {
    name: `5/3/1 ${duration}S - ${daysPerWeek}J/sem`,
    type: cycleType,
    goal: 'strength',
    duration,
    maxes,
    weeks,
    createdAt: new Date(),
    description: getCycleDescription(daysPerWeek, priorityLift),
  };

  return {
    program,
    reasoning: getReasonings(daysPerWeek, priorityLift),
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
