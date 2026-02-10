'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Save, Timer, Minus, Plus } from 'lucide-react';

interface RestTimerProps {
  exerciseType: string;
  onTimerEnd?: () => void;
}

const DEFAULT_REST_TIMES: Record<string, number> = {
  squat: 180,
  bench: 150,
  deadlift: 180,
  accessory: 90,
};

const STORAGE_KEY = 'restTimerPreferences';
const TIMER_STATE_KEY = 'restTimerState';

function getStoredRestTimes(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveRestTime(exerciseType: string, seconds: number) {
  if (typeof window === 'undefined') return;
  try {
    const stored = getStoredRestTimes();
    stored[exerciseType] = seconds;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Ignore storage errors
  }
}

interface TimerState {
  endTime: number; // timestamp when timer should reach 0
  totalTime: number;
  isRunning: boolean;
}

function saveTimerState(state: TimerState | null) {
  if (typeof window === 'undefined') return;
  try {
    if (state) {
      sessionStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state));
    } else {
      sessionStorage.removeItem(TIMER_STATE_KEY);
    }
  } catch {
    // Ignore
  }
}

function loadTimerState(): TimerState | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = sessionStorage.getItem(TIMER_STATE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function getDefaultTime(exerciseType: string): number {
  const stored = getStoredRestTimes();
  if (stored[exerciseType]) return stored[exerciseType];
  return DEFAULT_REST_TIMES[exerciseType] || 120;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function RestTimer({ exerciseType, onTimerEnd }: RestTimerProps) {
  const [totalTime, setTotalTime] = useState(() => {
    const saved = loadTimerState();
    return saved ? saved.totalTime : getDefaultTime(exerciseType);
  });
  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = loadTimerState();
    if (saved && saved.isRunning) {
      const remaining = Math.ceil((saved.endTime - Date.now()) / 1000);
      return Math.max(0, remaining);
    }
    return saved ? saved.totalTime : getDefaultTime(exerciseType);
  });
  const [isRunning, setIsRunning] = useState(() => {
    const saved = loadTimerState();
    if (saved && saved.isRunning) {
      const remaining = Math.ceil((saved.endTime - Date.now()) / 1000);
      return remaining > 0;
    }
    return false;
  });
  const [showSaved, setShowSaved] = useState(false);
  const endTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const hasEndedRef = useRef(false);

  // Play beep sound using Web Audio API
  const playBeep = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 200);

      // Second beep
      setTimeout(() => {
        const ctx2 = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc2 = ctx2.createOscillator();
        const gain2 = ctx2.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx2.destination);
        osc2.frequency.value = 1000;
        osc2.type = 'sine';
        gain2.gain.value = 0.3;
        osc2.start();
        setTimeout(() => { osc2.stop(); ctx2.close(); }, 300);
      }, 250);
    } catch {
      // Audio not supported
    }
  }, []);

  // Initialize endTimeRef from saved state
  useEffect(() => {
    const saved = loadTimerState();
    if (saved && saved.isRunning) {
      endTimeRef.current = saved.endTime;
    }
  }, []);

  // Timer tick using requestAnimationFrame + Date.now()
  useEffect(() => {
    if (!isRunning) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    hasEndedRef.current = false;

    const tick = () => {
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);

      if (remaining <= 0) {
        setTimeLeft(0);
        setIsRunning(false);
        saveTimerState(null);
        if (!hasEndedRef.current) {
          hasEndedRef.current = true;
          playBeep();
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
          }
          onTimerEnd?.();
        }
        return;
      }

      setTimeLeft(remaining);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isRunning, onTimerEnd, playBeep]);

  // Recalculate on visibility change (tab switch, app switch)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isRunning) {
        const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
        if (remaining <= 0) {
          setTimeLeft(0);
          setIsRunning(false);
          saveTimerState(null);
          if (!hasEndedRef.current) {
            hasEndedRef.current = true;
            playBeep();
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200, 100, 200]);
            }
            onTimerEnd?.();
          }
        } else {
          setTimeLeft(remaining);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isRunning, onTimerEnd, playBeep]);

  const handlePlayPause = useCallback(() => {
    if (timeLeft === 0) {
      // Reset and start
      const newEndTime = Date.now() + totalTime * 1000;
      endTimeRef.current = newEndTime;
      setTimeLeft(totalTime);
      setIsRunning(true);
      saveTimerState({ endTime: newEndTime, totalTime, isRunning: true });
    } else if (isRunning) {
      // Pause: save remaining time
      setIsRunning(false);
      saveTimerState({ endTime: endTimeRef.current, totalTime, isRunning: false });
    } else {
      // Resume: set new endTime based on current timeLeft
      const newEndTime = Date.now() + timeLeft * 1000;
      endTimeRef.current = newEndTime;
      setIsRunning(true);
      saveTimerState({ endTime: newEndTime, totalTime, isRunning: true });
    }
  }, [timeLeft, totalTime, isRunning]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(totalTime);
    saveTimerState(null);
  }, [totalTime]);

  const adjustTime = useCallback((delta: number) => {
    const newTotal = Math.max(10, totalTime + delta);
    setTotalTime(newTotal);
    if (!isRunning) {
      setTimeLeft(newTotal);
    }
  }, [totalTime, isRunning]);

  const handleSave = useCallback(() => {
    saveRestTime(exerciseType, totalTime);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 1500);
  }, [exerciseType, totalTime]);

  const progress = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const isLowTime = timeLeft <= 10 && timeLeft > 0;

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg mb-2">
      <Timer className="h-4 w-4 text-muted-foreground shrink-0" />

      {/* Time display with progress background */}
      <div className="relative flex-1 h-8 bg-background rounded overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 transition-all duration-1000 ${
            isRunning
              ? isLowTime
                ? 'bg-destructive/30'
                : 'bg-primary/20'
              : 'bg-muted'
          }`}
          style={{ width: `${progress}%` }}
        />
        <div className={`absolute inset-0 flex items-center justify-center font-mono text-lg font-bold ${
          isLowTime && isRunning ? 'text-destructive animate-pulse' : ''
        }`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => adjustTime(-10)}
          disabled={isRunning || totalTime <= 10}
        >
          <Minus className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => adjustTime(10)}
          disabled={isRunning}
        >
          <Plus className="h-3 w-3" />
        </Button>

        <Button
          variant={isRunning ? 'destructive' : 'default'}
          size="icon"
          className="h-7 w-7"
          onClick={handlePlayPause}
        >
          {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleReset}
          disabled={timeLeft === totalTime && !isRunning}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleSave}
          disabled={isRunning}
          title="Sauvegarder ce temps"
        >
          {showSaved ? (
            <span className="text-[10px] text-green-500">✓</span>
          ) : (
            <Save className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  );
}
