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
  const [totalTime, setTotalTime] = useState(() => getDefaultTime(exerciseType));
  const [timeLeft, setTimeLeft] = useState(() => getDefaultTime(exerciseType));
  const [isRunning, setIsRunning] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            // Play beep sound
            playBeep();
            // Vibrate if supported
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200, 100, 200]);
            }
            onTimerEnd?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, onTimerEnd, playBeep]);

  const handlePlayPause = useCallback(() => {
    if (timeLeft === 0) {
      setTimeLeft(totalTime);
    }
    setIsRunning(prev => !prev);
  }, [timeLeft, totalTime]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(totalTime);
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
