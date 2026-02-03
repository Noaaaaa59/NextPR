import { Timestamp } from 'firebase/firestore';

export type ExerciseType = 'squat' | 'bench' | 'deadlift' | 'accessory';

export interface Set {
  weight: number;
  reps: number;
  rpe?: number;
  completed: boolean;
}

export interface Exercise {
  name: string;
  type: ExerciseType;
  sets: Set[];
}

export interface Workout {
  id?: string;
  userId: string;
  programId?: string;
  date: Timestamp;
  exercises: Exercise[];
  duration?: number;
  notes?: string;
  completed: boolean;
}

export interface Lift {
  id?: string;
  userId: string;
  exercise: 'squat' | 'bench' | 'deadlift';
  weight: number;
  reps: number;
  rpe?: number;
  estimatedMax: number;
  date: Timestamp;
  notes?: string;
  videoUrl?: string;
}
