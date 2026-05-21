"use client";

// SpeechRecognition + AudioContext-based shadowing utility (browser-only).

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: { results: { 0: { transcript: string; confidence?: number } }[] }) => void) | null;
  onerror: ((ev: { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export function getSpeechRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  return new Ctor();
}

export function shadowingAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
}

// Simple kana similarity: 0..1 (LCS-based)
export function kanaSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const norm = (s: string) => s.replace(/\s|。|、|！|？/g, "");
  const x = Array.from(norm(a));
  const y = Array.from(norm(b));
  const m = x.length;
  const n = y.length;
  if (m === 0 || n === 0) return 0;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (x[i - 1] === y[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n] / Math.max(m, n);
}

export type MicLevelStream = {
  start: () => Promise<void>;
  stop: () => void;
  get: () => number; // 0..1
};

export function createMicLevelStream(): MicLevelStream {
  let stream: MediaStream | null = null;
  let ctx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let raf: number | null = null;
  let level = 0;
  let data = new Uint8Array(0);

  const tick = () => {
    if (!analyser) return;
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    level = Math.min(1, rms * 3);
    raf = requestAnimationFrame(tick);
  };

  return {
    async start() {
      if (typeof navigator === "undefined" || !navigator.mediaDevices) throw new Error("no media");
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const Ctor = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
        ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) throw new Error("no audio context");
      ctx = new Ctor();
      const source = ctx.createMediaStreamSource(stream);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      data = new Uint8Array(new ArrayBuffer(analyser.fftSize));
      tick();
    },
    stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
      analyser?.disconnect();
      analyser = null;
      ctx?.close();
      ctx = null;
      stream?.getTracks().forEach((t) => t.stop());
      stream = null;
      level = 0;
    },
    get: () => level,
  };
}
