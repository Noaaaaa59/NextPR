export type TrainingGoal = 'strength' | 'hypertrophy' | 'peaking' | 'general';
export type CycleType = '531' | 'linear' | 'block' | 'hypertrophy';

export interface Maxes {
  squat: number;
  bench: number;
  deadlift: number;
}

export interface SetPrescription {
  reps: number;
  percentage: number;
  weight?: number;
  rpe?: number;
  amrap?: boolean;
}

export interface ExercisePrescription {
  name: string;
  type: 'squat' | 'bench' | 'deadlift' | 'accessory';
  sets: SetPrescription[];
  notes?: string;
  isToolExercise?: boolean;
}

export interface DayPrescription {
  dayNumber: number;
  name: string;
  mainLift: 'squat' | 'bench' | 'deadlift';
  exercises: ExercisePrescription[];
}

export interface WeekPrescription {
  weekNumber: number;
  name: string;
  isDeload: boolean;
  days: DayPrescription[];
  focus: string;
}

export interface GeneratedProgram {
  id?: string;
  name: string;
  type: CycleType;
  goal: TrainingGoal;
  duration: number;
  maxes: Maxes;
  weeks: WeekPrescription[];
  createdAt: Date;
  description: string;
}

export interface ProgramRecommendation {
  program: GeneratedProgram;
  reasoning: string[];
  expectedProgress: {
    squat: number;
    bench: number;
    deadlift: number;
  };
}
