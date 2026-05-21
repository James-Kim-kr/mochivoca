"use client";

type Lang = "ja-JP" | "ko-KR";

let voicesCache: SpeechSynthesisVoice[] | null = null;
let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !window.speechSynthesis) return Promise.resolve([]);
  if (voicesCache && voicesCache.length > 0) return Promise.resolve(voicesCache);
  if (voicesPromise) return voicesPromise;

  voicesPromise = new Promise((resolve) => {
    const tryLoad = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        voicesCache = v;
        resolve(v);
        return true;
      }
      return false;
    };
    if (tryLoad()) return;
    const handler = () => {
      if (tryLoad()) {
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
      }
    };
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    setTimeout(() => {
      if (!voicesCache) {
        voicesCache = window.speechSynthesis.getVoices();
        resolve(voicesCache);
      }
    }, 1500);
  });
  return voicesPromise;
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: Lang): SpeechSynthesisVoice | undefined {
  const exact = voices.find((v) => v.lang === lang);
  if (exact) return exact;
  const prefix = lang.slice(0, 2);
  return voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

export async function speak(text: string, lang: Lang = "ja-JP", opts: SpeakOptions = {}): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis || !text) return;
  const voices = await loadVoices();
  await new Promise<void>((resolve) => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = lang;
      const v = pickVoice(voices, lang);
      if (v) u.voice = v;
      u.rate = opts.rate ?? (lang === "ja-JP" ? 0.85 : 1);
      u.pitch = opts.pitch ?? 1;
      u.volume = opts.volume ?? 1;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      resolve();
    }
  });
}

export function cancelSpeech() {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function ttsAvailable(): boolean {
  return typeof window !== "undefined" && !!window.speechSynthesis;
}

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
