"use client";

import { useEffect, useRef, useState } from "react";

interface UseTimerOpts {
  duration: number; // ms
  running: boolean;
  onTimeout?: () => void;
  tickMs?: number;
  key?: string | number; // changing key resets the timer
}

export function useTimer({ duration, running, onTimeout, tickMs = 100, key }: UseTimerOpts) {
  const [remaining, setRemaining] = useState(duration);
  const startedAtRef = useRef<number | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    setRemaining(duration);
    startedAtRef.current = null;
  }, [key, duration]);

  useEffect(() => {
    if (!running) return;
    if (startedAtRef.current == null) {
      startedAtRef.current = Date.now() - (duration - remaining);
    }
    const id = setInterval(() => {
      const elapsed = Date.now() - (startedAtRef.current ?? Date.now());
      const rem = Math.max(0, duration - elapsed);
      setRemaining(rem);
      if (rem === 0) {
        clearInterval(id);
        onTimeoutRef.current?.();
      }
    }, tickMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, key]);

  return {
    remaining,
    progress: remaining / duration, // 1 → 0
    secondsLeft: Math.ceil(remaining / 1000),
  };
}

export function useCountdown(targetTs: number, tickMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);
  const remaining = Math.max(0, targetTs - now);
  const d = Math.floor(remaining / 86_400_000);
  const h = Math.floor((remaining % 86_400_000) / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1000);
  return { remaining, d, h, m, s };
}
