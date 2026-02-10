import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, FieldValue } from 'firebase/firestore';
import { auth, db } from './config';
import { User } from '@/types/user';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export async function signInWithGoogle(): Promise<FirebaseUser> {
  const result = await signInWithPopup(auth, googleProvider);
  await createOrUpdateUser(result.user);
  return result.user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

async function createOrUpdateUser(firebaseUser: FirebaseUser): Promise<void> {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const newUser: Omit<User, 'createdAt'> & { createdAt: FieldValue } = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || 'Anonymous',
      photoURL: firebaseUser.photoURL || '',
      createdAt: serverTimestamp(),
      preferences: {
        weightUnit: 'kg',
        theme: 'dark',
        themeColor: 'rouge',
        themeMode: 'dark',
        restTimerDefault: 180,
      },
      bodyweight: 0,
      experience: 'beginner',
      friends: [],
      onboardingCompleted: false,
    };

    await setDoc(userRef, newUser);
  }
}

export async function getUserData(uid: string): Promise<User | null> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return userSnap.data() as User;
  }

  return null;
}
