'use client';

import { useEffect, useRef } from 'react';
import { Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

export interface NewPR {
  exercise: 'squat' | 'bench' | 'deadlift';
  weight: number;
  reps: number;
  previousWeight: number | null;
}

interface PRCelebrationProps {
  newPRs: NewPR[];
  onDismiss: () => void;
}

const exerciseLabels: Record<string, string> = {
  squat: 'Squat',
  bench: 'Bench Press',
  deadlift: 'Deadlift',
};

function fireConfetti() {
  // Big burst from the center
  confetti({
    particleCount: 100,
    spread: 80,
    origin: { y: 0.6 },
    colors: ['#f59e0b', '#fbbf24', '#d97706', '#ffffff', '#fde68a'],
    zIndex: 70,
  });

  // Side cannons with delay
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: ['#f59e0b', '#fbbf24', '#d97706', '#ffffff'],
      zIndex: 70,
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: ['#f59e0b', '#fbbf24', '#d97706', '#ffffff'],
      zIndex: 70,
    });
  }, 200);

  // Second wave
  setTimeout(() => {
    confetti({
      particleCount: 60,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#f59e0b', '#fbbf24', '#d97706', '#fde68a'],
      zIndex: 70,
    });
  }, 500);
}

export function PRCelebration({ newPRs, onDismiss }: PRCelebrationProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const confettiFired = useRef(false);

  useEffect(() => {
    if (!confettiFired.current) {
      confettiFired.current = true;
      fireConfetti();
    }

    timeoutRef.current = setTimeout(onDismiss, 4000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onDismiss]);

  if (newPRs.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 animate-in fade-in duration-300"
      onClick={onDismiss}
    >
      <div
        className="relative bg-card border-2 border-amber-500/50 rounded-2xl p-8 mx-4 max-w-sm w-full text-center shadow-2xl shadow-amber-500/20 animate-in zoom-in-75 fade-in duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ping glow */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 h-16 w-16 rounded-full bg-amber-400/30 animate-ping" />

        {/* Trophy */}
        <div className="relative flex justify-center mb-4">
          <Trophy className="h-16 w-16 text-amber-500 animate-bounce" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-amber-500 mb-1">
          {newPRs.length > 1 ? 'Nouveaux PRs !' : 'Nouveau PR !'}
        </h2>
        <p className="text-muted-foreground text-sm mb-4">Record personnel battu</p>

        {/* PR List */}
        <div className="space-y-3">
          {newPRs.map((pr, index) => (
            <div
              key={pr.exercise}
              className="bg-amber-500/10 rounded-lg p-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
              style={{ animationDelay: `${200 + index * 150}ms`, animationFillMode: 'both' }}
            >
              <div className="font-semibold text-lg">{exerciseLabels[pr.exercise]}</div>
              <div className="text-2xl font-bold text-amber-500">
                {pr.weight} kg x {pr.reps}
              </div>
              {pr.previousWeight !== null && (
                <div className="text-xs text-muted-foreground mt-1">
                  Ancien PR : {pr.previousWeight} kg
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tap hint */}
        <p className="text-xs text-muted-foreground mt-4 animate-pulse">
          Touche pour continuer
        </p>
      </div>
    </div>
  );
}
