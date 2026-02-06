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

export type WorkoutStatus = 'draft' | 'completed';

export interface Workout {
  id?: string;
  userId: string;
  programId?: string;
  date: Timestamp;
  exercises: Exercise[];
  duration?: number;
  notes?: string;
  completed: boolean;
  status?: WorkoutStatus;
}

export interface DraftWorkout {
  id?: string;
  userId: string;
  exercises: Exercise[];
  title: string;
  programWeek?: number;
  programDay?: number;
  totalWeeks?: number;
  daysPerWeek?: number;
  startedAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Lift {
  id?: string;
  userId: string;
  workoutId?: string;
  exercise: 'squat' | 'bench' | 'deadlift';
  weight: number;
  reps: number;
  rpe?: number;
  estimatedMax: number;
  date: Timestamp;
  notes?: string;
  videoUrl?: string;
  averageRating?: number;
  ratingCount?: number;
}

export interface FormRating {
  id?: string;
  liftId: string;
  liftOwnerId: string;
  raterId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  createdAt: Timestamp;
}
