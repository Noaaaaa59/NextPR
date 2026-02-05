import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './config';
import { Workout, Lift, DraftWorkout, FormRating } from '@/types/workout';
import { Program } from '@/types/program';
import { User } from '@/types/user';
import { calculateOneRepMax } from '../calculations/oneRepMax';
import { Timestamp } from 'firebase/firestore';

export async function createWorkout(workout: Omit<Workout, 'id'>): Promise<string> {
  const workoutsRef = collection(db, 'users', workout.userId, 'workouts');
  const docRef = await addDoc(workoutsRef, workout);
  return docRef.id;
}

export async function getWorkouts(userId: string, limitCount: number = 50): Promise<Workout[]> {
  const workoutsRef = collection(db, 'users', userId, 'workouts');
  const q = query(workoutsRef, orderBy('date', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Workout[];
}

export async function updateWorkout(
  userId: string,
  workoutId: string,
  data: Partial<Workout>
): Promise<void> {
  const workoutRef = doc(db, 'users', userId, 'workouts', workoutId);
  await updateDoc(workoutRef, data as DocumentData);
}

export async function deleteWorkout(userId: string, workoutId: string): Promise<void> {
  const workoutRef = doc(db, 'users', userId, 'workouts', workoutId);

  // Get workout to find its date
  const workoutSnap = await getDoc(workoutRef);
  if (workoutSnap.exists()) {
    const workoutData = workoutSnap.data();
    const workoutDate = workoutData.date as Timestamp;

    // Find and delete lifts created within 5 minutes of the workout
    const liftsRef = collection(db, 'users', userId, 'lifts');
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in ms
    const startTime = new Timestamp(
      workoutDate.seconds - 300,
      workoutDate.nanoseconds
    );
    const endTime = new Timestamp(
      workoutDate.seconds + 300,
      workoutDate.nanoseconds
    );

    const liftsQuery = query(
      liftsRef,
      where('date', '>=', startTime),
      where('date', '<=', endTime)
    );

    const liftsSnap = await getDocs(liftsQuery);

    // Delete all matching lifts
    const deletePromises = liftsSnap.docs.map(liftDoc =>
      deleteDoc(doc(db, 'users', userId, 'lifts', liftDoc.id))
    );
    await Promise.all(deletePromises);
  }

  // Delete the workout
  await deleteDoc(workoutRef);
}

// Helper to remove undefined values recursively (Firestore doesn't accept undefined)
function removeUndefined(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => removeUndefined(item));
  }
  if (obj instanceof Timestamp) {
    return obj;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value);
      }
    }
    return cleaned;
  }
  return obj;
}

export async function saveDraftWorkout(userId: string, draft: Omit<DraftWorkout, 'id' | 'userId' | 'startedAt' | 'updatedAt'> & { startedAt?: Timestamp }): Promise<string> {
  const draftRef = doc(db, 'users', userId, 'draftWorkout', 'current');

  let existingStartedAt: Timestamp | null = null;
  try {
    const existingDraft = await getDoc(draftRef);
    if (existingDraft.exists()) {
      existingStartedAt = existingDraft.data()?.startedAt || null;
    }
  } catch (e) {
    // Ignore if we can't read existing draft
  }

  const now = Timestamp.now();

  // Build draft data and clean all undefined values recursively
  const draftData = removeUndefined({
    exercises: draft.exercises,
    title: draft.title,
    userId,
    startedAt: draft.startedAt || existingStartedAt || now,
    updatedAt: now,
    programWeek: draft.programWeek,
    programDay: draft.programDay,
    totalWeeks: draft.totalWeeks,
    daysPerWeek: draft.daysPerWeek,
  });

  await setDoc(draftRef, draftData);
  return 'current';
}

export async function getDraftWorkout(userId: string): Promise<DraftWorkout | null> {
  const draftRef = doc(db, 'users', userId, 'draftWorkout', 'current');
  const snapshot = await getDoc(draftRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as DraftWorkout;
}

export async function deleteDraftWorkout(userId: string): Promise<void> {
  const draftRef = doc(db, 'users', userId, 'draftWorkout', 'current');
  await deleteDoc(draftRef);
}

export async function createLift(lift: Omit<Lift, 'id'>): Promise<string> {
  const liftsRef = collection(db, 'users', lift.userId, 'lifts');
  const docRef = await addDoc(liftsRef, lift);
  return docRef.id;
}

export async function getLifts(
  userId: string,
  exercise?: 'squat' | 'bench' | 'deadlift'
): Promise<Lift[]> {
  const liftsRef = collection(db, 'users', userId, 'lifts');
  let q = query(liftsRef, orderBy('date', 'desc'));

  if (exercise) {
    q = query(liftsRef, where('exercise', '==', exercise), orderBy('date', 'desc'));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Lift[];
}

export async function getPersonalRecord(
  userId: string,
  exercise: 'squat' | 'bench' | 'deadlift'
): Promise<Lift | null> {
  const liftsRef = collection(db, 'users', userId, 'lifts');
  const q = query(
    liftsRef,
    where('exercise', '==', exercise),
    orderBy('weight', 'desc')
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  // Get all lifts and find the one with the highest actual weight
  // In case of ties, prefer the one with fewer reps (closer to true max)
  let bestLift: (Lift & { id: string }) | null = null;
  let maxWeight = 0;

  for (const doc of snapshot.docs) {
    const lift = {
      id: doc.id,
      ...doc.data(),
    } as Lift & { id: string };

    if (lift.weight > maxWeight ||
        (lift.weight === maxWeight && bestLift && lift.reps < bestLift.reps)) {
      maxWeight = lift.weight;
      bestLift = lift;
    }
  }

  return bestLift;
}

export async function getTrueOneRepMax(
  userId: string,
  exercise: 'squat' | 'bench' | 'deadlift'
): Promise<Lift | null> {
  const liftsRef = collection(db, 'users', userId, 'lifts');
  const q = query(
    liftsRef,
    where('exercise', '==', exercise),
    where('reps', '==', 1),
    orderBy('weight', 'desc'),
    limit(1)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  return {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data(),
  } as Lift;
}

export async function getBestEstimated1RM(
  userId: string,
  exercise: 'squat' | 'bench' | 'deadlift'
): Promise<Lift | null> {
  const liftsRef = collection(db, 'users', userId, 'lifts');
  const q = query(
    liftsRef,
    where('exercise', '==', exercise),
    orderBy('date', 'desc')
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  let bestLift: (Lift & { id: string }) | null = null;
  let maxEstimated = 0;

  for (const doc of snapshot.docs) {
    const lift = {
      id: doc.id,
      ...doc.data(),
    } as Lift & { id: string };

    const estimated = lift.estimatedMax || calculateOneRepMax(lift.weight, lift.reps);

    if (estimated > maxEstimated) {
      maxEstimated = estimated;
      bestLift = lift;
    }
  }

  return bestLift;
}

export async function getBestSBDSession(userId: string): Promise<{
  total: number;
  date: any;
  lifts: { squat: number; bench: number; deadlift: number };
} | null> {
  const workoutsRef = collection(db, 'users', userId, 'workouts');
  const q = query(workoutsRef, orderBy('date', 'desc'));
  const snapshot = await getDocs(q);

  let bestSession: {
    total: number;
    date: any;
    lifts: { squat: number; bench: number; deadlift: number };
  } | null = null;
  let maxTotal = 0;

  for (const doc of snapshot.docs) {
    const workout = doc.data() as Workout;

    const exercises = workout.exercises;
    const squatEx = exercises.find(e => e.type === 'squat');
    const benchEx = exercises.find(e => e.type === 'bench');
    const deadliftEx = exercises.find(e => e.type === 'deadlift');

    if (!squatEx || !benchEx || !deadliftEx) {
      continue;
    }

    const squatMax = Math.max(...squatEx.sets.map(s => s.weight));
    const benchMax = Math.max(...benchEx.sets.map(s => s.weight));
    const deadliftMax = Math.max(...deadliftEx.sets.map(s => s.weight));

    const total = squatMax + benchMax + deadliftMax;

    if (total > maxTotal) {
      maxTotal = total;
      bestSession = {
        total,
        date: workout.date,
        lifts: { squat: squatMax, bench: benchMax, deadlift: deadliftMax }
      };
    }
  }

  return bestSession;
}

export async function createProgram(program: Omit<Program, 'id'>): Promise<string> {
  const programsRef = collection(db, 'users', program.userId!, 'programs');
  const docRef = await addDoc(programsRef, program);
  return docRef.id;
}

export async function getPrograms(userId: string): Promise<Program[]> {
  const programsRef = collection(db, 'users', userId, 'programs');
  const q = query(programsRef, orderBy('startDate', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Program[];
}

export async function getActiveProgram(userId: string): Promise<Program | null> {
  const programsRef = collection(db, 'users', userId, 'programs');
  const q = query(programsRef, where('active', '==', true), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  return {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data(),
  } as Program;
}

export async function updateProgram(
  userId: string,
  programId: string,
  data: Partial<Program>
): Promise<void> {
  const programRef = doc(db, 'users', userId, 'programs', programId);
  await updateDoc(programRef, data as DocumentData);
}

export async function updateUserProfile(userId: string, data: Partial<User>): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, data as DocumentData);
}

export async function getLeaderboard(limitCount: number = 100) {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(query(usersRef, limit(limitCount)));

  const leaderboardData = await Promise.all(
    snapshot.docs.map(async (userDoc) => {
      const userId = userDoc.id;
      const userData = userDoc.data() as User;

      const [squatPR, benchPR, deadliftPR] = await Promise.all([
        getPersonalRecord(userId, 'squat'),
        getPersonalRecord(userId, 'bench'),
        getPersonalRecord(userId, 'deadlift'),
      ]);

      const squat = squatPR?.weight || 0;
      const bench = benchPR?.weight || 0;
      const deadlift = deadliftPR?.weight || 0;

      return {
        userId,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        bodyweight: userData.bodyweight,
        gender: userData.gender,
        squat,
        bench,
        deadlift,
        total: squat + bench + deadlift,
      };
    })
  );

  return leaderboardData.filter((entry) => entry.total > 0).sort((a, b) => b.total - a.total);
}

export async function addFriend(userId: string, friendId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data() as User;
    const friends = userData.friends || [];

    if (!friends.includes(friendId)) {
      friends.push(friendId);
      await updateDoc(userRef, { friends } as DocumentData);
    }
  }
}

export async function removeFriend(userId: string, friendId: string): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const userData = userSnap.data() as User;
    const friends = (userData.friends || []).filter((id) => id !== friendId);
    await updateDoc(userRef, { friends } as DocumentData);
  }
}

export async function getFriends(userId: string): Promise<User[]> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return [];

  const userData = userSnap.data() as User;
  const friendIds = userData.friends || [];

  const friendsData = await Promise.all(
    friendIds.map(async (friendId) => {
      const friendRef = doc(db, 'users', friendId);
      const friendSnap = await getDoc(friendRef);
      return friendSnap.exists() ? (friendSnap.data() as User) : null;
    })
  );

  return friendsData.filter((friend) => friend !== null) as User[];
}

export async function saveInitialPRs(
  userId: string,
  prs: { squat: number; bench: number; deadlift: number }
): Promise<void> {
  const liftsRef = collection(db, 'users', userId, 'lifts');
  const exercises: Array<'squat' | 'bench' | 'deadlift'> = ['squat', 'bench', 'deadlift'];

  for (const exercise of exercises) {
    const weight = prs[exercise];
    if (weight > 0) {
      await addDoc(liftsRef, {
        userId,
        exercise,
        weight,
        reps: 1,
        estimatedMax: weight,
        date: serverTimestamp(),
        notes: 'PR initial (onboarding)',
      });
    }
  }
}

export async function completeOnboarding(
  userId: string,
  profileData: {
    gender: 'male' | 'female';
    bodyweight: number;
    experience: 'beginner' | 'intermediate' | 'advanced' | 'elite';
    programSettings?: {
      daysPerWeek: 3 | 4 | 5;
      durationWeeks: 4 | 6;
      priorityLift: 'squat' | 'bench' | 'deadlift';
    };
  },
  prs: { squat: number; bench: number; deadlift: number }
): Promise<void> {
  await updateUserProfile(userId, {
    ...profileData,
    onboardingCompleted: true,
  });

  await saveInitialPRs(userId, prs);
}

// Video Upload Functions
export async function uploadLiftVideo(
  userId: string,
  liftId: string,
  file: File
): Promise<string> {
  const videoRef = ref(storage, `users/${userId}/lifts/${liftId}/video`);
  await uploadBytes(videoRef, file);
  const downloadUrl = await getDownloadURL(videoRef);

  // Update the lift with the video URL
  const liftRef = doc(db, 'users', userId, 'lifts', liftId);
  await updateDoc(liftRef, { videoUrl: downloadUrl });

  return downloadUrl;
}

export async function deleteLiftVideo(userId: string, liftId: string): Promise<void> {
  const videoRef = ref(storage, `users/${userId}/lifts/${liftId}/video`);
  try {
    await deleteObject(videoRef);
  } catch (e) {
    // Video might not exist, ignore
  }

  const liftRef = doc(db, 'users', userId, 'lifts', liftId);
  await updateDoc(liftRef, { videoUrl: null, averageRating: null, ratingCount: null });
}

// Form Rating Functions
export async function addFormRating(
  liftOwnerId: string,
  liftId: string,
  raterId: string,
  rating: 1 | 2 | 3 | 4 | 5,
  comment?: string
): Promise<string> {
  const ratingsRef = collection(db, 'users', liftOwnerId, 'lifts', liftId, 'ratings');

  // Check if user already rated this lift
  const existingQuery = query(ratingsRef, where('raterId', '==', raterId), limit(1));
  const existingSnap = await getDocs(existingQuery);

  if (!existingSnap.empty) {
    // Update existing rating
    const existingRatingRef = existingSnap.docs[0].ref;
    await updateDoc(existingRatingRef, {
      rating,
      comment: comment || null,
      createdAt: Timestamp.now(),
    });
    await updateLiftAverageRating(liftOwnerId, liftId);
    return existingSnap.docs[0].id;
  }

  // Create new rating
  const ratingData: Omit<FormRating, 'id'> = {
    liftId,
    liftOwnerId,
    raterId,
    rating,
    comment,
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(ratingsRef, ratingData);
  await updateLiftAverageRating(liftOwnerId, liftId);
  return docRef.id;
}

export async function getFormRatings(liftOwnerId: string, liftId: string): Promise<FormRating[]> {
  const ratingsRef = collection(db, 'users', liftOwnerId, 'lifts', liftId, 'ratings');
  const q = query(ratingsRef, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FormRating[];
}

export async function getUserRating(
  liftOwnerId: string,
  liftId: string,
  raterId: string
): Promise<FormRating | null> {
  const ratingsRef = collection(db, 'users', liftOwnerId, 'lifts', liftId, 'ratings');
  const q = query(ratingsRef, where('raterId', '==', raterId), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  return {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data(),
  } as FormRating;
}

async function updateLiftAverageRating(liftOwnerId: string, liftId: string): Promise<void> {
  const ratingsRef = collection(db, 'users', liftOwnerId, 'lifts', liftId, 'ratings');
  const snapshot = await getDocs(ratingsRef);

  if (snapshot.empty) {
    const liftRef = doc(db, 'users', liftOwnerId, 'lifts', liftId);
    await updateDoc(liftRef, { averageRating: null, ratingCount: 0 });
    return;
  }

  let total = 0;
  snapshot.docs.forEach((doc) => {
    total += doc.data().rating;
  });

  const averageRating = Math.round((total / snapshot.docs.length) * 10) / 10;
  const ratingCount = snapshot.docs.length;

  const liftRef = doc(db, 'users', liftOwnerId, 'lifts', liftId);
  await updateDoc(liftRef, { averageRating, ratingCount });
}

export async function getLift(userId: string, liftId: string): Promise<Lift | null> {
  const liftRef = doc(db, 'users', userId, 'lifts', liftId);
  const snapshot = await getDoc(liftRef);

  if (!snapshot.exists()) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  } as Lift;
}

export async function updateLift(
  userId: string,
  liftId: string,
  data: Partial<Lift>
): Promise<void> {
  const liftRef = doc(db, 'users', userId, 'lifts', liftId);
  await updateDoc(liftRef, data as DocumentData);
}
