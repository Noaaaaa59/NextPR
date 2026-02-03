export type StrengthLevel = 'untrained' | 'novice' | 'intermediate' | 'advanced' | 'elite' | 'international';

export interface ProgressDataPoint {
  date: string;
  value: number;
}

export interface StrengthStandard {
  exercise: 'squat' | 'bench' | 'deadlift';
  bodyweight: number;
  untrained: number;
  novice: number;
  intermediate: number;
  advanced: number;
  elite: number;
  international: number;
}

export interface PersonalRecord {
  exercise: 'squat' | 'bench' | 'deadlift';
  weight: number;
  reps: number;
  estimatedMax: number;
  date: string;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL: string;
  bodyweight: number;
  squat: number;
  bench: number;
  deadlift: number;
  total: number;
  wilks?: number;
}
