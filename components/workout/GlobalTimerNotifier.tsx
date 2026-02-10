'use client';

import { useEffect, useRef } from 'react';

const TIMER_STATE_KEY = 'restTimerState';

interface TimerState {
  endTime: number;
  totalTime: number;
  isRunning: boolean;
}

function loadTimerState(): TimerState | null {
  try {
    const stored = sessionStorage.getItem(TIMER_STATE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function GlobalTimerNotifier() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const notifiedRef = useRef<number | null>(null);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    intervalRef.current = setInterval(() => {
      const state = loadTimerState();
      if (!state || !state.isRunning) {
        notifiedRef.current = null;
        return;
      }

      // Already notified for this timer
      if (notifiedRef.current === state.endTime) return;

      if (Date.now() >= state.endTime) {
        notifiedRef.current = state.endTime;

        // Send native notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Repos terminé !', {
            body: 'Ton temps de repos est écoulé. C\'est reparti !',
            icon: '/icon-192x192.png',
            tag: 'rest-timer',
          });
        }

        // Vibrate
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200, 100, 200]);
        }

        // Clean up timer state
        sessionStorage.removeItem(TIMER_STATE_KEY);
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return null;
}
