import { useEffect, useMemo, useState } from 'react';
import type { TimerState } from '../types/song';

const TICK_MS = 200;

export interface Countdown {
  remainingMs: number | null;
  progress: number;
  seconds: number;
  urgent: boolean;
}

/**
 * Reloj de presentación. El host marca `sentAt` con su propio reloj; el móvil
 * calcula el desfase una sola vez por mensaje para no acumular drift.
 */
export function useCountdown(timer: TimerState, sentAt: number | null): Countdown {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (timer.endsAt === null) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, [timer.endsAt, timer.durationMs, sentAt]);

  const offset = useMemo(() => (sentAt === null ? 0 : sentAt - Date.now()), [sentAt]);

  if (timer.endsAt === null) {
    return { remainingMs: null, progress: 0, seconds: 0, urgent: false };
  }

  const remainingMs = Math.max(0, timer.endsAt - (now + offset));
  const duration = timer.durationMs ?? 0;
  const progress = duration > 0 ? Math.min(1, remainingMs / duration) : 0;

  return {
    remainingMs,
    progress,
    seconds: Math.ceil(remainingMs / 1000),
    urgent: remainingMs <= 5000,
  };
}
