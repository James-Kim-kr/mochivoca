"use client";

import { useEffect, useRef, useState } from "react";

interface UseTimerOpts {
  duration: number; // ms
  running: boolean;
  onTimeout?: () => void;
  tickMs?: number;
  key?: string | number; // changing key restarts the timer from `duration`
}

/**
 * Countdown timer. When `key` or `duration` changes, or `running` flips false→true,
 * the timer restarts from `duration`. While `running` is false the interval is paused
 * and `remaining` freezes at its last value (good for showing time left when an
 * answer is locked in).
 */
export function useTimer({ duration, running, onTimeout, tickMs = 100, key }: UseTimerOpts) {
  const [remaining, setRemaining] = useState(duration);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    setRemaining(duration);
    const id = setInterval(() => {
      const rem = Math.max(0, duration - (Date.now() - start));
      setRemaining(rem);
      if (rem === 0) {
        clearInterval(id);
        onTimeoutRef.current?.();
      }
    }, tickMs);
    return () => clearInterval(id);
  }, [running, key, duration, tickMs]);

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
