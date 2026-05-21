"use client";

type WakeLockSentinelLike = { release: () => Promise<void> };
let sentinel: WakeLockSentinelLike | null = null;

type WakeLockAPI = { request: (type: "screen") => Promise<WakeLockSentinelLike> };

export async function acquireWakeLock(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  const wl = (navigator as unknown as { wakeLock?: WakeLockAPI }).wakeLock;
  if (!wl) return false;
  try {
    sentinel = await wl.request("screen");
    return true;
  } catch {
    sentinel = null;
    return false;
  }
}

export async function releaseWakeLock() {
  try {
    await sentinel?.release();
  } catch {}
  sentinel = null;
}

export function wakeLockSupported(): boolean {
  if (typeof navigator === "undefined") return false;
  return "wakeLock" in navigator;
}
