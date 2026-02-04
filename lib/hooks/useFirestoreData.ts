'use client';

import useSWR from 'swr';
import { getPersonalRecord, getBestEstimated1RM, getBestSBDSession, getWorkouts, getDraftWorkout } from '@/lib/firebase/firestore';
import { Lift, Workout, DraftWorkout } from '@/types/workout';

// Custom fetcher that handles Firebase calls
const fetcher = async <T>(key: string, fn: () => Promise<T>): Promise<T> => {
  return fn();
};

// Hook for personal records
export function usePRs(userId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `prs-${userId}` : null,
    async () => {
      if (!userId) return null;
      const [squat, bench, deadlift] = await Promise.all([
        getPersonalRecord(userId, 'squat'),
        getPersonalRecord(userId, 'bench'),
        getPersonalRecord(userId, 'deadlift'),
      ]);
      return { squat, bench, deadlift };
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute deduplication
    }
  );

  return {
    prs: data || { squat: null, bench: null, deadlift: null },
    isLoading,
    error,
    refresh: mutate,
  };
}

// Hook for estimated 1RMs
export function useEstimated1RMs(userId: string | undefined) {
  const { data, error, isLoading } = useSWR(
    userId ? `estimated-${userId}` : null,
    async () => {
      if (!userId) return null;
      const [squat, bench, deadlift] = await Promise.all([
        getBestEstimated1RM(userId, 'squat'),
        getBestEstimated1RM(userId, 'bench'),
        getBestEstimated1RM(userId, 'deadlift'),
      ]);
      return { squat, bench, deadlift };
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  return {
    estimated: data || { squat: null, bench: null, deadlift: null },
    isLoading,
    error,
  };
}

// Hook for best SBD session
export function useBestSession(userId: string | undefined) {
  const { data, error, isLoading } = useSWR(
    userId ? `best-session-${userId}` : null,
    async () => {
      if (!userId) return null;
      return getBestSBDSession(userId);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );

  return {
    bestSession: data,
    isLoading,
    error,
  };
}

// Hook for workouts list
export function useWorkouts(userId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `workouts-${userId}` : null,
    async () => {
      if (!userId) return [];
      return getWorkouts(userId);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 30000, // 30 seconds for workouts
    }
  );

  return {
    workouts: data || [],
    isLoading,
    error,
    refresh: mutate,
  };
}

// Hook for draft workout
export function useDraftWorkout(userId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `draft-${userId}` : null,
    async () => {
      if (!userId) return null;
      return getDraftWorkout(userId);
    },
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  return {
    draft: data,
    isLoading,
    error,
    refresh: mutate,
  };
}

// Combined hook for dashboard data
export function useDashboardData(userId: string | undefined) {
  const { prs, isLoading: prsLoading, refresh: refreshPRs } = usePRs(userId);
  const { estimated, isLoading: estimatedLoading } = useEstimated1RMs(userId);
  const { bestSession, isLoading: sessionLoading } = useBestSession(userId);

  return {
    truePRs: prs,
    estimated1RMs: estimated,
    bestSession,
    loading: prsLoading || estimatedLoading || sessionLoading,
    refreshPRs,
  };
}
