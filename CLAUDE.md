# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Start local development server
npm run build    # Production build (static export)
npm run lint     # ESLint validation
npm start        # Run production server
```

## Tech Stack

- **Framework**: Next.js 16 with App Router, React 19, TypeScript (strict mode)
- **Styling**: Tailwind CSS 4, shadcn/ui components (Radix UI)
- **Backend**: Firebase (Authentication + Cloud Firestore)
- **Data Fetching**: SWR for client-side data
- **Charts**: Recharts for data visualization
- **Deployment**: Static export to Netlify

## Architecture Overview

### App Router Structure

```
app/
├── layout.tsx          # Root layout with AuthProvider wrapper
├── page.tsx            # Home redirect
├── login/page.tsx      # Google Sign-In
└── dashboard/
    ├── layout.tsx      # Protected route with auth guard
    ├── page.tsx        # Main dashboard (PRs display)
    ├── workouts/       # Workout history & logging
    ├── programs/       # Training programs
    ├── analytics/      # Progress charts
    ├── leaderboard/    # Community rankings
    └── profile/        # User settings
```

### Key Modules

- **`lib/firebase/`**: Firebase configuration and all Firestore CRUD operations
  - `config.ts` - Firebase initialization
  - `auth.ts` - Authentication + user management + social features
  - `firestore.ts` - Workouts, lifts, programs CRUD

- **`lib/calculations/`**: Powerlifting math
  - `oneRepMax.ts` - Epley & Brzycki 1RM formulas
  - `standards.ts` - Strength standards & Wilks score calculations
  - `volume.ts` - Volume load calculations

- **`lib/hooks/`**: Custom React hooks for Firestore queries
  - `useDashboardData()` - PRs, 1RMs, best session
  - `useWorkouts()` - Workout history

- **`components/auth/AuthProvider.tsx`**: React Context providing `useAuth()` hook with `user`, `userData`, `loading`, `refreshUserData()`

### Firestore Data Model

```
/users/{userId}
  - preferences, bodyweight, gender, experience, friends[]

  /users/{userId}/workouts/{workoutId}
  /users/{userId}/lifts/{liftId}      # PRs with estimatedMax
  /users/{userId}/programs/{programId}

/programs/{programId}                  # Public templates (read-only)
```

## Important Patterns

### Authentication Flow
- `AuthProvider` wraps app, syncs Firebase Auth with Firestore user profile
- Dashboard layout includes auth guard that redirects unauthenticated users
- `useAuth()` provides current user state throughout app

### Data Operations
- All Firestore operations centralized in `lib/firebase/firestore.ts`
- `estimatedMax` calculated and stored when saving lifts
- User data scoped via subcollections under `/users/{userId}/`

### Path Aliases
- `@/*` maps to project root (e.g., `@/lib/firebase/config`)

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

## Deployment Notes

- Static export enabled (`output: "export"` in next.config.ts)
- Images unoptimized (required for static export)
- Firestore rules deployment: `firebase deploy --only firestore:rules`

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update 'tasks/lessons.md' with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests -> then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management
1. **Plan First**: Write plan to 'tasks/todo.md' with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review to 'tasks/todo.md'
6. **Capture Lessons**: Update 'tasks/lessons.md' after corrections

## Core Principles
- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
