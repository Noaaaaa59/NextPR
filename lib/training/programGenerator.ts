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
  calculatePRTarget,
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
  useTrainingMax?: boolean;
}

function getWeekSets(cycleType: CycleType, weekNumber: number, duration: number = 4): WeekSetsResult {
  switch (cycleType) {
    case '531':
      // 5/3/1 a des structures différentes pour 4 et 6 semaines
      if (duration === 6) {
        return WEEK_531_EXTENDED[weekNumber] || WEEK_531_EXTENDED[1];
      }
      return WEEK_531[weekNumber] || WEEK_531[1];
    case 'linear':
      // Linear: 6 semaines, mapping pour 4 semaines
      if (duration === 4) {
        const mapping4: Record<number, number> = { 1: 1, 2: 3, 3: 5, 4: 6 };
        return WEEK_LINEAR[mapping4[weekNumber] || 1] || WEEK_LINEAR[1];
      }
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
  // 5/3/1 - structure spécifique avec test PR à la fin
  if (cycleType === '531') {
    if (duration === 4) {
      const names531_4 = ['5s (Volume)', '3s (Force)', 'Singles (Peak)', 'TEST PR 🎯'];
      return `Semaine ${weekNumber} - ${names531_4[weekNumber - 1] || '5/3/1'}`;
    }
    if (duration === 6) {
      const names531_6 = ['Volume 5x5', 'Volume+', 'Force (3s)', 'Force (2s/1s)', 'Peak (Singles)', 'TEST PR 🎯'];
      return `Semaine ${weekNumber} - ${names531_6[weekNumber - 1] || '5/3/1'}`;
    }
  }

  // Linear - test PR à la dernière semaine
  if (cycleType === 'linear') {
    if (duration === 4) {
      const namesLinear4 = ['Volume', 'Force', 'Peak', 'TEST PR 🎯'];
      return `Semaine ${weekNumber} - ${namesLinear4[weekNumber - 1] || 'Force'}`;
    }
    if (duration === 6) {
      const namesLinear6 = ['Volume', 'Volume+', 'Force', 'Force+', 'Peak', 'TEST PR 🎯'];
      return `Semaine ${weekNumber} - ${namesLinear6[weekNumber - 1] || 'Force'}`;
    }
  }

  // Block - déload seulement pour block (semaine 8)
  if (cycleType === 'block') {
    if (weekNumber <= 3) return `Semaine ${weekNumber} - Accumulation`;
    if (weekNumber <= 6) return `Semaine ${weekNumber} - Intensification`;
    if (weekNumber === 7) return `Semaine ${weekNumber} - TEST PR 🎯`;
    return `Semaine ${weekNumber} - Déload`;
  }

  // Hypertrophy
  if (cycleType === 'hypertrophy') {
    const namesHyper = ['Volume', 'Volume+', 'Intensité', 'Test AMRAP'];
    return `Semaine ${weekNumber} - ${namesHyper[weekNumber - 1] || 'Volume'}`;
  }

  return `Semaine ${weekNumber}`;
}

function getWeekFocus(cycleType: CycleType, weekNumber: number, duration: number): string {
  if (cycleType === '531') {
    const focus531_4 = [
      '5x5 @ 65-85% TM - AMRAP sur le dernier set. Volume et technique.',
      '4x3 @ 70-90% TM - AMRAP sur le dernier set. Force maximale.',
      'Singles pyramidaux jusqu\'à 95% TM. Préparation au test.',
      '🎯 TEST DE PR @ 102.5% 1RM - Singles montants jusqu\'au nouveau max !',
    ];
    const focus531_6 = [
      '5x5 @ 65-75% TM - Construire le volume. AMRAP sur le dernier set.',
      '5x5 @ 70-80% TM - Volume intensifié. AMRAP sur le dernier set.',
      '4x3 @ 75-87.5% TM - Transition vers la force.',
      'Doubles et singles jusqu\'à 95% TM. Habituer le système nerveux.',
      'Singles lourds jusqu\'à 100% TM. Peak d\'intensité.',
      '🎯 TEST DE PR @ 102.5% 1RM - Donne tout pour battre ton record !',
    ];
    return duration === 6 ? focus531_6[weekNumber - 1] || '' : focus531_4[weekNumber - 1] || '';
  }

  if (cycleType === 'linear') {
    const focusLinear4 = [
      '5x5 @ 72.5% - Construire le volume et la technique.',
      '5x3 @ 82.5% - Transition vers la force.',
      'Singles @ 90-95% - Peak d\'intensité.',
      '🎯 TEST DE PR @ 102.5% - Singles montants jusqu\'au nouveau max !',
    ];
    const focusLinear6 = [
      '5x5 @ 72.5% - Volume et adaptation.',
      '4x4 @ 77.5% - Volume intensifié.',
      '5x3 @ 82.5% - Transition vers la force.',
      '4x2 @ 87.5% - Doubles lourds.',
      'Singles @ 90-95% - Peak d\'intensité.',
      '🎯 TEST DE PR @ 102.5% - Donne tout pour battre ton record !',
    ];
    return duration === 6 ? focusLinear6[weekNumber - 1] || '' : focusLinear4[weekNumber - 1] || '';
  }

  if (cycleType === 'block') {
    const focusBlock = [
      '4x8 @ 67.5% - Accumulation de volume.',
      '4x6 @ 72.5% - Accumulation intensifiée.',
      '4x5 @ 77.5% - Fin de l\'accumulation.',
      '4x4 @ 82.5% - Début de l\'intensification.',
      '3x3 @ 87.5% - Force maximale.',
      '3x2 @ 90-92.5% - Préparation au peak.',
      '🎯 TEST DE PR @ 102.5% - Singles jusqu\'au nouveau max !',
      'Récupération active - Déload.',
    ];
    return focusBlock[weekNumber - 1] || '';
  }

  if (cycleType === 'hypertrophy') {
    const focusHyper = [
      '4x10 @ 62.5% - Volume pour l\'hypertrophie.',
      '4x10 @ 65% - Volume intensifié.',
      '5x8 @ 70% - Reps modérées, plus de charge.',
      'AMRAP @ 72.5% - Test de répétitions max.',
    ];
    return focusHyper[weekNumber - 1] || '';
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
  isDeload: boolean,
  isTestWeek: boolean = false
): DayPrescription {
  const liftNames = {
    squat: 'Squat',
    bench: 'Bench Press',
    deadlift: 'Deadlift',
  };

  // Pour le 5/3/1, utilise le Training Max sauf pour les semaines de test
  const is531 = cycleType === '531';
  const useTrainingMax = is531 && weekSets.useTrainingMax !== false;
  const isTestWeekForPR = is531 && weekSets.useTrainingMax === false;

  // Fonction pour calculer le poids selon le contexte
  const calcWeightForSet = (oneRepMax: number, percentage: number): number => {
    // Pour les sets de test PR (>100%), utilise calculatePRTarget pour garantir progression
    if (isTestWeekForPR && percentage > 100) {
      return calculatePRTarget(oneRepMax, percentage);
    }
    // Pour les semaines normales 5/3/1, utilise le Training Max
    if (useTrainingMax) {
      return calculateWorkingWeight531(oneRepMax, percentage);
    }
    // Sinon, utilise le 1RM direct
    return calculateWorkingWeight(oneRepMax, percentage);
  };

  const primaryExercise: ExercisePrescription = {
    name: liftNames[primaryLift],
    type: primaryLift,
    sets: weekSets.heavy.map((set) => ({
      ...set,
      weight: calcWeightForSet(maxes[primaryLift], set.percentage),
    })),
  };

  const secondaryExercise: ExercisePrescription = {
    name: liftNames[secondaryLift],
    type: secondaryLift,
    sets: weekSets.light.map((set) => ({
      ...set,
      weight: calcWeightForSet(maxes[secondaryLift], set.percentage),
    })),
  };

  const exercises: ExercisePrescription[] = [primaryExercise, secondaryExercise];

  if (is531 && weekSets.bbb && !isDeload && !isTestWeekForPR) {
    const bbbExercise: ExercisePrescription = {
      name: `${liftNames[primaryLift]} (BBB)`,
      type: primaryLift,
      isToolExercise: true,
      sets: weekSets.bbb.map((set) => ({
        ...set,
        weight: calcWeightForSet(maxes[primaryLift], set.percentage),
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
  // Déterminer si c'est une semaine de test ou de déload
  const isTestWeek = weekNumber === duration && cycleType !== 'block';
  // Seul 'block' a un vrai déload (semaine 8)
  const isDeload = cycleType === 'block' && weekNumber === 8;

  const weekSets = getWeekSets(cycleType, weekNumber, duration);

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
      isDeload,
      isTestWeek
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
    reasons.push('Basé sur le Training Max (90% du 1RM) pour les semaines d\'entraînement.');
    reasons.push('Dernière semaine = TEST DE PR avec des singles jusqu\'à 102.5% de ton 1RM actuel.');
    reasons.push('AMRAP sur les sets clés - ne va pas à l\'échec, garde 1-2 reps en réserve.');
    if (daysPerWeek <= 4) {
      reasons.push('BBB (5x10 @ 50%) les premières semaines pour le volume.');
    }
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
