import { Timestamp } from 'firebase/firestore';

export type WeightUnit = 'kg' | 'lbs';
export type Experience = 'beginner' | 'intermediate' | 'advanced' | 'elite';
export type Theme = 'light' | 'dark' | 'forest' | 'rose' | 'ocean' | 'sunset';
export type ThemeColor = 'rouge' | 'neutre' | 'forest' | 'rose' | 'ocean' | 'sunset';
export type ThemeMode = 'light' | 'dark' | 'auto';
export type Gender = 'male' | 'female';

export const WEIGHT_CATEGORIES_MALE = ['59', '66', '74', '83', '93', '105', '120', '120+'] as const;
export const WEIGHT_CATEGORIES_FEMALE = ['47', '52', '57', '63', '69', '76', '84', '84+'] as const;

export type WeightCategoryMale = typeof WEIGHT_CATEGORIES_MALE[number];
export type WeightCategoryFemale = typeof WEIGHT_CATEGORIES_FEMALE[number];
export type WeightCategory = WeightCategoryMale | WeightCategoryFemale;

export function getWeightCategory(bodyweight: number, gender: Gender): WeightCategory {
  const categories = gender === 'male' ? WEIGHT_CATEGORIES_MALE : WEIGHT_CATEGORIES_FEMALE;
  const limits = gender === 'male'
    ? [59, 66, 74, 83, 93, 105, 120, Infinity]
    : [47, 52, 57, 63, 69, 76, 84, Infinity];

  for (let i = 0; i < limits.length; i++) {
    if (bodyweight <= limits[i]) {
      return categories[i];
    }
  }
  return categories[categories.length - 1];
}

export interface UserPreferences {
  weightUnit: WeightUnit;
  theme: Theme;
  themeColor?: ThemeColor;
  themeMode?: ThemeMode;
  restTimerDefault?: number; // Optional - now managed per exercise in localStorage
}

export interface ProgramProgress {
  currentWeek: number;
  currentDay: number;
  startedAt?: Timestamp;
}

export type PriorityLift = 'squat' | 'bench' | 'deadlift';
export type ProgramType = '531' | 'linear';

export type TrainingMaxPercentage = 90 | 95 | 100;

export interface ProgramSettings {
  daysPerWeek: 3 | 4 | 5;
  durationWeeks: 4 | 6;
  priorityLift: PriorityLift;
  programType?: ProgramType;
  trainingMaxPercentage?: TrainingMaxPercentage;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: Timestamp;
  preferences: UserPreferences;
  bodyweight: number;
  gender?: Gender;
  experience: Experience;
  friends?: string[];
  onboardingCompleted?: boolean;
  programProgress?: ProgramProgress;
  programSettings?: ProgramSettings;
}
