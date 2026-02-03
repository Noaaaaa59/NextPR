import { Timestamp } from 'firebase/firestore';

export type ProgramType = 'preset' | 'custom' | 'ai-generated';
export type ProgramDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ProgramFocus = 'strength' | 'hypertrophy' | 'peaking';

export interface ExerciseTemplate {
  name: string;
  sets: number;
  reps: string;
  intensity: string;
  notes?: string;
}

export interface SessionTemplate {
  day: string;
  exercises: ExerciseTemplate[];
}

export interface WeekTemplate {
  weekNumber: number;
  sessions: SessionTemplate[];
}

export interface Program {
  id?: string;
  userId?: string;
  name: string;
  type: ProgramType;
  templateId?: string;
  duration: number;
  currentWeek: number;
  startDate: Timestamp;
  weeks: WeekTemplate[];
  active: boolean;
}

export interface ProgramTemplate {
  id?: string;
  name: string;
  author: string;
  description: string;
  difficulty: ProgramDifficulty;
  duration: number;
  focus: ProgramFocus;
  weeks: WeekTemplate[];
}
