# Powerlifting App - Complete Codebase Exploration

## Executive Summary

This is a fully-featured **powerlifting tracking and training application** built with Next.js 14+, React 19, TypeScript, Firebase, and Tailwind CSS. The app is designed for powerlifters to:
- Log workouts and individual lifts
- Track personal records (PRs) and estimated 1RMs
- View progress analytics with charts
- Access AI-generated training programs (5/3/1 Wendler)
- Compete on community leaderboards
- Manage user profiles and settings

**Status**: Production-ready MVP with sophisticated features

---

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript (strict mode)
- **Styling**: Tailwind CSS 4, shadcn/ui (Radix UI components)
- **Backend**: Firebase (Authentication + Cloud Firestore)
- **Data Fetching**: SWR for client-side caching
- **Charts**: Recharts for data visualization
- **UI Icons**: lucide-react
- **Deployment**: Static export to Netlify

### Project Structure
```
C:\Dev\powerlifting-app/
├── app/                           # Next.js App Router
│   ├── layout.tsx                # Root layout with AuthProvider
│   ├── page.tsx                  # Home (redirect to dashboard)
│   ├── login/page.tsx            # Google Sign-In page
│   └── dashboard/                # Protected routes
│       ├── layout.tsx            # Dashboard layout with auth guard
│       ├── page.tsx              # Main dashboard (PRs display)
│       ├── workouts/
│       │   ├── page.tsx          # Workout history & management
│       │   └── new/page.tsx      # Workout logging interface
│       ├── programs/page.tsx     # Training programs browser
│       ├── analytics/page.tsx    # Progress charts & stats
│       ├── leaderboard/page.tsx  # Community rankings
│       └── profile/page.tsx      # User settings
├── components/                   # React components
│   ├── auth/
│   │   ├── AuthProvider.tsx      # Authentication context
│   │   └── GoogleSignIn.tsx      # Sign-in button
│   ├── charts/
│   │   ├── ProgressionChart.tsx  # Line chart for lift progression
│   │   └── StrengthStandardsChart.tsx  # Standards bars
│   ├── layout/
│   │   ├── Navbar.tsx            # Desktop navigation
│   │   ├── BottomNav.tsx         # Mobile navigation (5 tabs)
│   │   └── MobileHeader.tsx      # Mobile top header
│   ├── workout/
│   │   └── RestTimer.tsx         # Rest timer with localStorage
│   ├── leaderboard/
│   │   └── Podium.tsx            # Podium display for rankings
│   ├── onboarding/
│   │   └── OnboardingModal.tsx   # First-time user setup
│   ├── icons/
│   │   └── LiftIcons.tsx         # Squat, Bench, Deadlift icons
│   └── ui/                       # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── dialog.tsx
│       └── confirm-dialog.tsx
├── lib/                          # Core business logic
│   ├── firebase/
│   │   ├── config.ts             # Firebase initialization
│   │   ├── auth.ts               # Auth functions (Google login)
│   │   └── firestore.ts          # All CRUD operations
│   ├── calculations/
│   │   ├── oneRepMax.ts          # 1RM formulas (Epley, Brzycki)
│   │   ├── standards.ts          # Strength standards & Wilks
│   │   └── volume.ts             # Volume calculations
│   ├── training/
│   │   ├── types.ts              # Training data types
│   │   ├── programGenerator.ts   # 5/3/1 program generation
│   │   └── percentages.ts        # 5/3/1 percentages & sets
│   ├── hooks/
│   │   └── useFirestoreData.ts   # SWR hooks for Firestore
│   └── utils.ts                  # Utility functions
├── types/                        # TypeScript type definitions
│   ├── user.ts                   # User profile, preferences
│   ├── workout.ts                # Workouts, lifts, exercises
│   ├── program.ts                # Training programs
│   └── analytics.ts              # Analytics data
├── public/                       # Static assets
└── .env.local                    # Firebase credentials (PRIVATE)
```

---

## Data Models

### User Profile (`/users/{userId}`)
```typescript
interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: Timestamp;

  // Physical attributes
  bodyweight: number;                    // kg or lbs
  gender: 'male' | 'female';
  experience: 'beginner' | 'intermediate' | 'advanced' | 'elite';

  // Preferences
  preferences: {
    weightUnit: 'kg' | 'lbs';
    theme: 'light' | 'dark';
    restTimerDefault?: number;           // seconds
  };

  // Program customization
  programSettings: {
    daysPerWeek: 3 | 4 | 5;
    durationWeeks: 4 | 6;
    priorityLift: 'squat' | 'bench' | 'deadlift';
    programType: '531';
  };

  // Program progress
  programProgress: {
    currentWeek: number;
    currentDay: number;
    startedAt?: Timestamp;
  };

  // Social
  friends?: string[];                    // Array of user UIDs
  onboardingCompleted: boolean;
}
```

### Workouts (`/users/{userId}/workouts/{workoutId}`)
```typescript
interface Workout {
  id?: string;
  userId: string;
  date: Timestamp;
  exercises: Exercise[];
  duration?: number;
  notes?: string;
  completed: boolean;
  status?: 'draft' | 'completed';
  programId?: string;
}

interface Exercise {
  name: string;
  type: 'squat' | 'bench' | 'deadlift' | 'accessory';
  sets: Set[];
}

interface Set {
  weight: number;
  reps: number;
  rpe?: number;                         // Rate of Perceived Exertion (1-10)
  completed: boolean;
}
```

### Personal Records (`/users/{userId}/lifts/{liftId}`)
```typescript
interface Lift {
  id?: string;
  userId: string;
  exercise: 'squat' | 'bench' | 'deadlift';
  weight: number;
  reps: number;
  rpe?: number;
  estimatedMax: number;                 // Calculated using Epley formula
  date: Timestamp;
  notes?: string;
  videoUrl?: string;
}
```

### Draft Workouts (`/users/{userId}/draftWorkout/current`)
Temporary storage for in-progress workouts with auto-save

### Programs (`/users/{userId}/programs/{programId}`)
Training programs with detailed week/day/exercise structure

---

## Features Implemented

### 1. Authentication & User Management ✅
- **Google Sign-In** via Firebase Auth
- Auto user profile creation on first login
- User preferences (weight unit, theme)
- Session persistence via Firebase

**Files**:
- `app/login/page.tsx` - Login UI
- `components/auth/AuthProvider.tsx` - Context provider
- `lib/firebase/auth.ts` - Firebase auth functions

### 2. Dashboard (Main Hub) ✅
Displays:
- Personal Records (squat, bench, deadlift) with 1RM estimates
- Best session total (S/B/D combined)
- Recent workout summary
- Active training program status
- Quick action buttons

**File**: `app/dashboard/page.tsx` (412 lines)

**Key Features**:
- Streaming data from Firebase via SWR hooks
- Real-time PR comparisons
- Strength level calculation based on bodyweight
- Program progress tracking

### 3. Workout Logging ✅
Advanced interface to log exercises and sets:
- Auto-load from draft (resume in-progress workouts)
- Program preset loading (auto-fills exercises from training program)
- Set-by-set logging with weight/reps
- Visual completion status per set
- Auto-save every 500ms to draft
- Automatic 1RM estimation per set
- Rest timer per exercise with localStorage preferences

**File**: `app/dashboard/workouts/new/page.tsx` (627 lines)

**Key Features**:
- Draft auto-save with debouncing
- Preset exercises from program
- Tool exercises support (optional, grayed out)
- Accessory exercise handling
- Best-set selection for lift logging
- Auto-increment program progress on completion
- SWR cache invalidation

### 4. Workout History ✅
View, edit, and manage past workouts:
- Chronological list with expandable details
- Edit exercise names, weights, reps
- Delete exercises/sets
- Add new exercises/sets to past workouts
- Estimated 1RM calculation display
- Manual workout deletion with associated lift cleanup

**File**: `app/dashboard/workouts/page.tsx` (391 lines)

**Key Features**:
- Inline editing mode
- Orphan lift deletion (lifts created within 5 min of workout)
- SWR cache invalidation on changes

### 5. Training Programs ✅
AI-generated 5/3/1 program customization:
- Duration: 4 or 6 weeks
- Frequency: 3, 4, or 5 days/week
- Priority lift selection (for 4+ day/week)
- Automatic personalization based on user maxes
- Weekly summaries with exercises
- Skip day functionality
- Restart cycle at specific week/day
- Expected progress projections

**File**: `app/dashboard/programs/page.tsx` (516 lines)

**Key Features**:
- Program generation via `programGenerator.ts`
- Week/day detailed view with collapsible expansion
- Current day highlighting
- Deload week detection
- Exercise set display (e.g., "3×5×80%")

### 6. Analytics & Progress Charts ✅
Data visualization and strength tracking:
- Lift progression line charts (Recharts)
- Strength standards comparison (untrained → international)
- Wilks score calculation and display
- Weight category determination (IPF standards)
- Session count tracking

**File**: `app/dashboard/analytics/page.tsx` (259 lines)

**Key Features**:
- Charts for all three main lifts
- Standards visualization per bodyweight
- Strength level badges
- Gender-specific standards (male/female)

### 7. Community Leaderboard ✅
Global and weight-category rankings:
- Global leaderboard (top PRs by total)
- Category-based filtering (IPF weight classes)
- Podium display (1st, 2nd, 3rd)
- Full rankings list with user profiles
- Personal ranking visibility
- Support for male/female categories

**File**: `app/dashboard/leaderboard/page.tsx` (285 lines)

**Key Features**:
- Real-time leaderboard from Firestore
- User photo display
- Gender-aware categories
- Current user highlighting

### 8. User Profile & Settings ✅
Comprehensive user management:
- Display name editing
- Bodyweight (with unit conversion UI)
- Gender selection (affects strength standards)
- Experience level selection
- Weight unit preference (kg vs lbs)
- Program settings (days/week, duration, priority lift)
- Elite strength standards reference
- Sign out functionality

**File**: `app/dashboard/profile/page.tsx` (442 lines)

**Key Features**:
- In-place editing mode
- IPF weight category display
- Elite standards reference table
- Profile reload on save

### 9. Rest Timer ✅
Per-exercise rest timer with advanced features:
- Exercise-specific default times
- LocalStorage persistence per exercise type
- Play/pause/reset controls
- Time adjustment (+10/-10 seconds)
- Web Audio API beeps on completion
- Haptic vibration on mobile
- Visual progress bar with color change at low time
- Built directly into workout logging interface

**File**: `components/workout/RestTimer.tsx` (241 lines)

**Key Features**:
- localStorage for user preferences
- Audio + haptic feedback
- Smooth animations
- Compact component design

### 10. Onboarding ✅
First-time user setup flow:
- Personal info collection (gender, bodyweight, experience)
- Initial PR setup (squat, bench, deadlift)
- Program preferences
- Automatic PR lift creation in Firestore

**File**: `components/onboarding/OnboardingModal.tsx`

### 11. Strength Standards & Wilks Score ✅
Powerlifting-specific calculations:
- IPF weight categories (male: 59-120+, female: 47-84+)
- Strength level determination (untrained → international)
- Wilks coefficient formula (adjusts total by bodyweight)
- Standard tables for all bodyweight categories

**File**: `lib/calculations/standards.ts` (161 lines)

**Key Functions**:
- `getStrengthLevel()` - Determines strength level from weight
- `calculateWilksScore()` - Gender and bodyweight adjusted total
- `getAllStandards()` - Returns all levels for category
- `getWeightCategory()` - IPF category determination

### 12. 5/3/1 Program Generator ✅
Sophisticated AI-powered program generation:
- Personalized training maxes (90% of current 1RM)
- Sets/reps based on progression week
- Estimated progress by cycle
- Multi-day split support
- Accessory exercise recommendations
- Deload week integration
- Customizable cycle length

**File**: `lib/training/programGenerator.ts` (400+ lines)

**Key Functions**:
- `generateProgram()` - Creates full 4 or 6-week cycle
- `formatWeekSummary()` - Human-readable week description
- `formatSetDisplay()` - Set prescription formatting (e.g., "3×5@80%")

---

## Key Technical Patterns

### Authentication Flow
```
1. User visits /dashboard (protected route)
2. AuthProvider checks onAuthStateChanged()
3. If not logged in → redirect to /login
4. Google Sign-In popup
5. Firebase creates/updates user document
6. AuthProvider.userData synced with Firestore
7. Dashboard loads with user context
```

### Data Fetching Pattern (SWR)
```typescript
// Hook in lib/hooks/useFirestoreData.ts
export function usePRs(userId: string | undefined) {
  const { data, mutate } = useSWR(
    userId ? `prs-${userId}` : null,
    async () => {
      const [squat, bench, deadlift] = await Promise.all([
        getPersonalRecord(userId, 'squat'),
        getPersonalRecord(userId, 'bench'),
        getPersonalRecord(userId, 'deadlift'),
      ]);
      return { squat, bench, deadlift };
    },
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );
  return { prs: data || {}, refresh: mutate };
}

// Usage in component
const { truePRs, loading } = useDashboardData(user?.uid);
```

### Auto-Save Draft Pattern
```typescript
// In /workouts/new/page.tsx
const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

const scheduleDraftSave = useCallback(() => {
  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
  saveTimeoutRef.current = setTimeout(() => {
    saveDraft(exercises, workoutTitle, programInfo);
  }, 500); // Save after 500ms of inactivity
}, [saveDraft, exercises, workoutTitle, programInfo]);

useEffect(() => {
  if (draftLoaded && exercises.length > 0) {
    scheduleDraftSave();
  }
  return () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
  };
}, [exercises, workoutTitle, draftLoaded, scheduleDraftSave]);
```

### Firestore Query Patterns
```typescript
// Get PR (best weight regardless of reps)
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

  // Find best lift (highest weight, ties broken by lower reps)
  let bestLift = snapshot.docs[0].data() as Lift;
  // ... comparison logic ...
  return bestLift;
}

// Get workouts with date filtering
export async function getWorkouts(
  userId: string,
  limitCount: number = 50
): Promise<Workout[]> {
  const q = query(
    collection(db, 'users', userId, 'workouts'),
    orderBy('date', 'desc'),
    limit(limitCount)
  );
  return getDocs(q).then(snap =>
    snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  );
}
```

### Cache Invalidation Pattern
```typescript
// After saving workout
await deleteDraftWorkout(user.uid);

// Invalidate SWR caches
mutate(`draft-${user.uid}`, null, false);      // Remove draft
mutate(`workouts-${user.uid}`);                // Refresh workouts
mutate(`prs-${user.uid}`);                     // Refresh PRs
mutate(`estimated-${user.uid}`);               // Refresh estimates
mutate(`best-session-${user.uid}`);            // Refresh session
```

---

## Calculations & Math

### 1RM Estimation (Epley Formula)
```typescript
// Used: weight × (1 + 0.0333 × reps)
// Accurate for reps 1-10
export function calculateOneRepMax(weight: number, reps: number): number {
  if (reps === 1) return weight;
  return Math.round(weight * (1 + 0.0333 * reps));
}
```

### Wilks Coefficient (IPF Standard)
```typescript
// Adjusts total by bodyweight for fair comparison
// Males: different coefficients than females
const wilks = (500 * total) /
  (a + b*bw + c*bw² + d*bw³ + e*bw⁴ + f*bw⁵);
```

### Strength Standards
- Based on IPF (International Powerlifting Federation) standards
- 8 bodyweight categories per gender
- 6 strength levels (untrained → international)
- Standards in absolute weight (kg or lbs)

---

## Component Hierarchy

```
RootLayout
├── AuthProvider
└── body
    ├── DashboardLayout (protected)
    │   ├── MobileHeader
    │   ├── Navbar (desktop)
    │   ├── main
    │   │   ├── DashboardPage
    │   │   ├── WorkoutsPage
    │   │   ├── NewWorkoutPage
    │   │   ├── ProgramsPage
    │   │   ├── AnalyticsPage
    │   │   ├── LeaderboardPage
    │   │   └── ProfilePage
    │   ├── BottomNav (mobile)
    │   └── OnboardingModal
    └── LoginPage
```

---

## Key Files Reference

### Core Business Logic
| File | LOC | Purpose |
|------|-----|---------|
| `lib/firebase/firestore.ts` | 492 | All Firestore CRUD operations |
| `lib/calculations/standards.ts` | 161 | Strength standards & Wilks |
| `lib/training/programGenerator.ts` | 400+ | 5/3/1 program generation |
| `lib/hooks/useFirestoreData.ts` | 149 | SWR data fetching hooks |
| `lib/calculations/oneRepMax.ts` | 27 | 1RM formulas |

### UI Pages
| File | LOC | Purpose |
|------|-----|---------|
| `app/dashboard/page.tsx` | 412 | Main dashboard hub |
| `app/dashboard/workouts/new/page.tsx` | 627 | Workout logging |
| `app/dashboard/programs/page.tsx` | 516 | Program browser |
| `app/dashboard/analytics/page.tsx` | 259 | Charts & stats |
| `app/dashboard/workouts/page.tsx` | 391 | Workout history |
| `app/dashboard/leaderboard/page.tsx` | 285 | Rankings |
| `app/dashboard/profile/page.tsx` | 442 | User settings |

### Components
| File | Purpose |
|------|---------|
| `components/auth/AuthProvider.tsx` | Authentication context |
| `components/workout/RestTimer.tsx` | Rest timer with audio |
| `components/charts/ProgressionChart.tsx` | Line chart for lifts |
| `components/charts/StrengthStandardsChart.tsx` | Standards bars |
| `components/layout/Navbar.tsx` | Desktop navigation |
| `components/layout/BottomNav.tsx` | Mobile navigation |
| `components/onboarding/OnboardingModal.tsx` | First-time setup |
| `components/leaderboard/Podium.tsx` | Podium display |

---

## Firebase Integration

### Firestore Rules (Security)
```
- Users can only read/write their own documents
- `/users/{userId}` subcollections are user-scoped
- Public leaderboard data is readable by all
- Friend lists are restricted to user
```

### Database Structure
```
/users/
  /{userId}/
    (profile data - name, email, stats)
    /workouts/
      /{workoutId} - Completed workouts
    /lifts/
      /{liftId} - Individual lift records (PRs)
    /programs/
      /{programId} - User's training programs
    /draftWorkout/
      /current - In-progress workout (auto-save)

/programs/ (optional public template)
  /{programId} - Public training program templates
```

---

## State Management Approach

### Context Providers
- **AuthProvider** - User auth state + userData sync
- **SWRConfig** - Global cache invalidation (in dashboard layout)

### Local State
- Component useState() for UI state
- useRef() for timers and cleanup
- localStorage for rest timer preferences

### Server State (Firestore)
- SWR hooks for data fetching with caching
- Manual `mutate()` calls for cache invalidation
- Firebase real-time listeners in AuthProvider

---

## UI/UX Highlights

### Mobile-First Design
- Bottom navigation (5 tabs) on mobile
- Desktop navbar on screens > 768px
- Responsive grid layouts
- Touch-friendly button sizes

### Visual Hierarchy
- Color-coded by lift (squat, bench, deadlift)
- PRs highlighted in destructive color (red)
- Cards with hover effects
- Icons for quick recognition

### Accessibility
- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Color contrast compliant

### Performance
- Image optimization in design
- SWR deduplication and caching
- Draft auto-save doesn't block UI
- Lazy loading of charts

---

## Missing/Incomplete Features

### Gaps Identified

1. **Social Features** (Partial)
   - Friend list structure exists in User type
   - `addFriend()` / `removeFriend()` functions exist
   - UI for friend management NOT implemented
   - No friend leaderboards

2. **Program Management** (Partial)
   - Program display works
   - User cannot create/save custom programs
   - No program templates library
   - Cannot switch between programs mid-cycle

3. **Video Upload** (Not implemented)
   - Lift type has `videoUrl` field
   - No upload interface
   - No video display in history

4. **Notifications** (Not implemented)
   - No PR alerts
   - No friend activity alerts
   - No workout reminders

5. **Data Export** (Not implemented)
   - No CSV/PDF export of lifts
   - No backup functionality

6. **Search/Filter** (Partial)
   - Leaderboard has category filter
   - No date-range workout filtering
   - No exercise-specific analytics

---

## Potential Improvements & Enhancements

### User Experience
1. **Progressive Web App (PWA)** - Add offline support
   - Service worker for offline workouts
   - Sync when reconnected

2. **Dark/Light Theme Toggle**
   - Theme preference stored in Firestore
   - System preference detection

3. **Advanced Rest Timer**
   - Per-set recommended rest based on RPE
   - Auto-advance to next set

4. **Social Competition**
   - Challenge friends to lifts
   - Weekly leaderboards (rolling window)
   - Achievement badges

### Performance
1. **Database Optimization**
   - Add Firestore indexes for common queries
   - Pagination for workout history (currently loads 50)
   - Archive old lifts to sub-collection

2. **Caching Strategy**
   - Service worker for offline support
   - React Query for improved caching
   - IndexedDB for offline storage

### Features
1. **Advanced Programs**
   - Custom program builder
   - RPE-based autoregulation
   - AI program generation via OpenAI
   - Program marketplace

2. **Analytics Enhancements**
   - Heatmap of training intensity
   - Volume progression tracking
   - Body composition trends
   - Estimated maxes over time

3. **Mobile App**
   - React Native version
   - Native push notifications
   - Device motion API for form tracking

---

## Recent Commits & Development History

Recent bug fixes indicate active maintenance:
- ✅ "delete associated lifts when deleting a workout"
- ✅ "refresh workouts and PRs cache after completing workout"
- ✅ "properly clear draft when completing workout"
- ✅ "add rest timer for each exercise"
- ✅ "invalidate SWR cache after draft deletion"

This shows focus on:
- Data consistency
- Cache management
- UX polish

---

## Development Guidelines (From CLAUDE.md)

### Build Commands
```bash
npm run dev      # Local dev server
npm run build    # Production static export
npm run lint     # ESLint validation
npm start        # Production server
```

### Best Practices Enforced
1. **Simplicity First** - Minimal impact changes
2. **No Laziness** - Find root causes
3. **Strict TypeScript** - Type safety
4. **No Temporary Fixes** - Permanent solutions
5. **Senior Standards** - High code quality

### Workflow Emphasis
- Plan mode for complex tasks
- Verification before marking complete
- Autonomous bug fixing (don't ask for direction)
- Task tracking with lessons.md

---

## Deployment Status

- **Current**: Development/staging
- **Deployment Target**: Netlify with static export
- **Firebase**: Cloud Firestore (real-time)
- **Authentication**: Firebase Auth with Google provider
- **Environment**: Requires `.env.local` with Firebase credentials

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| **Total Pages** | 7 main + login |
| **Components** | 17 custom + shadcn/ui |
| **Firestore Operations** | 20+ CRUD functions |
| **Calculations** | 3 major (1RM, Wilks, Standards) |
| **Data Types** | 20+ TypeScript interfaces |
| **Authentication Methods** | Google Sign-In |
| **Charts** | 2 (Progression, Standards) |
| **Training Programs** | 1 (5/3/1, customizable 3-5 days/week) |

---

## Conclusion

This is a **sophisticated, production-quality powerlifting tracking application** with:

✅ **Strengths**:
- Solid data architecture with Firestore
- Advanced calculations (Wilks, standards, 1RM)
- AI-powered program generation (5/3/1)
- Mobile-first responsive design
- Modern tech stack (Next.js 14, React 19)
- Active maintenance and bug fixes
- Comprehensive user profile system

⚠️ **Areas for Enhancement**:
- Social features incomplete
- Limited program customization
- No offline support yet
- Analytics could be deeper
- Video recording not integrated

The app is ready for production use and has strong foundation for scaling with additional features. The codebase follows best practices with TypeScript, proper error handling, and thoughtful UX patterns.
