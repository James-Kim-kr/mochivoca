"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import SwipeDeck from "@/components/SwipeDeck";
import ToggleBar from "@/components/ToggleBar";
import Mochi, { MochiMood } from "@/components/Mochi";
import type { Word } from "@/lib/words";
import type { Toggles } from "@/components/Flashcard";
import { cancelSpeech, speak, ttsAvailable, wait } from "@/lib/tts";
import { acquireWakeLock, releaseWakeLock } from "@/lib/wakeLock";
import { useStoreReady } from "@/components/SessionGate";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex-1 grid place-items-center"><Mochi size={120} /></div>}>
      <StudyPage />
    </Suspense>
  );
}

function StudyPage() {
  const router = useRouter();
  const params = useSearchParams();
  const dayParam = params.get("day");
  const day = dayParam ? parseInt(dayParam, 10) : null;

  const ready = useStoreReady();
  const [hydrated, setHydrated] = useState(false);
  const [queue, setQueue] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [knewCount, setKnewCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [toggles, setToggles] = useState<Toggles>({ kanji: true, kana: true, meaning: true });
  const [mood, setMood] = useState<MochiMood>("idle");

  const level = useAppStore((s) => s.level);
  const getDailyQueue = useAppStore((s) => s.getDailyQueue);
  const getStageQueue = useAppStore((s) => s.getStageQueue);
  const answer = useAppStore((s) => s.answer);
  const markSessionComplete = useAppStore((s) => s.markSessionComplete);
  const markStageComplete = useAppStore((s) => s.markStageComplete);
  const handsFree = useAppStore((s) => s.handsFree);
  const setHandsFree = useAppStore((s) => s.setHandsFree);
  const autoSpeak = useAppStore((s) => s.autoSpeak);
  const setAutoSpeak = useAppStore((s) => s.setAutoSpeak);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (!hydrated || !ready) return;
    if (!level) {
      router.replace("/onboarding");
      return;
    }
    const q = day && Number.isFinite(day) ? getStageQueue(day) : getDailyQueue();
    if (q.length === 0) {
      router.replace("/done");
      return;
    }
    setQueue(q);
  }, [hydrated, ready, level, day, getDailyQueue, getStageQueue, router]);

  useEffect(() => () => cancelSpeech(), []);

  // Wake lock while in hands-free mode (prevents screen sleep on mobile)
  useEffect(() => {
    if (handsFree) {
      acquireWakeLock();
      return () => {
        releaseWakeLock();
      };
    }
  }, [handsFree]);

  const current = queue[index];
  const total = queue.length;
  const advancingRef = useRef(false);

  const finishSession = () => {
    markSessionComplete();
    if (day && level) markStageComplete(level, day);
    router.push("/done");
  };

  const handleAnswer = (knew: boolean) => {
    if (!current || advancingRef.current) return;
    advancingRef.current = true;
    answer(current.id, knew);
    setMood(knew ? "happy" : "sad");
    if (knew) setKnewCount((c) => c + 1);
    else setRetryCount((c) => c + 1);

    setTimeout(() => {
      setMood("idle");
      advancingRef.current = false;
      if (index + 1 >= total) finishSession();
      else setIndex((i) => i + 1);
    }, 350);
  };

  // Hands-free auto loop
  useEffect(() => {
    if (!handsFree || !current || !ttsAvailable()) return;
    let cancelled = false;
    (async () => {
      await wait(2000); if (cancelled) return;
      await speak(current.example_reading || current.kana, "ja-JP", { rate: 0.85 });
      if (cancelled) return;
      await wait(800); if (cancelled) return;
      await speak(current.meaning, "ko-KR", { rate: 1 });
      if (cancelled) return;
      await wait(700); if (cancelled) return;
      if (index + 1 >= total) finishSession();
      else setIndex((i) => i + 1);
    })();
    return () => { cancelled = true; cancelSpeech(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handsFree, current?.id]);

  if (!hydrated || !current) {
    return (
      <div className="flex-1 grid place-items-center">
        <Mochi mood="idle" size={120} />
      </div>
    );
  }

  const progress = (index / total) * 100;

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Top progress bar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="w-10 h-10 rounded-full surface border border-subtle text-default grid place-items-center press-down shadow-card"
          aria-label="홈으로"
        >
          <CloseIcon />
        </button>
        <div className="flex-1 h-3 surface-subtle rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-coral-400 to-teal-400"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="text-xs font-extrabold text-default w-14 text-right tabular-nums">
          {index + 1}<span className="text-faint">/{total}</span>
        </div>
      </div>

      {/* Mode chip row */}
      <div className="flex gap-2 items-center text-[11px] flex-wrap">
        {day && (
          <span className="px-2.5 py-1 rounded-full bg-coral-100 dark:bg-coral-500/15 text-coral-600 dark:text-coral-300 font-bold">
            Day {day}
          </span>
        )}
        <ModeChip
          active={autoSpeak}
          onClick={() => setAutoSpeak(!autoSpeak)}
          icon="🔊"
          label="자동발음"
        />
        <ModeChip
          active={handsFree}
          onClick={() => setHandsFree(!handsFree)}
          icon="🎧"
          label="핸즈프리"
          accent
        />
      </div>

      {/* Mascot */}
      <div className="flex justify-center">
        <Mochi mood={mood} size={64} />
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{
            opacity: 0,
            scale: 0.9,
            x: mood === "happy" ? 320 : mood === "sad" ? -320 : 0,
            rotate: mood === "happy" ? 8 : mood === "sad" ? -8 : 0,
          }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <SwipeDeck word={current} toggles={toggles} autoSpeak={autoSpeak && !handsFree} onAnswer={handleAnswer} />
        </motion.div>
      </AnimatePresence>

      {/* Toggle bar */}
      <ToggleBar toggles={toggles} onChange={setToggles} />

      {/* Action area */}
      {handsFree ? (
        <div className="rounded-3xl bg-coral-50 dark:bg-coral-500/10 border border-coral-200 dark:border-coral-500/30 px-4 py-4 text-center">
          <div className="text-coral-600 dark:text-coral-300 font-extrabold text-sm">🎧 핸즈프리 모드</div>
          <div className="text-[11px] text-muted mt-1">자동으로 발음이 재생되고 다음 카드로 넘어가요</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleAnswer(false)}
            className="btn-clay bg-white dark:bg-ink-700 text-coral-600 dark:text-coral-300 border-2 border-coral-200 dark:border-coral-500/40"
          >
            <CrossIcon />
            <span className="text-base">다시 학습</span>
          </button>
          <button
            onClick={() => handleAnswer(true)}
            className="btn-clay bg-teal-400 text-ink-700"
          >
            <CheckIcon />
            <span className="text-base">알아요</span>
          </button>
        </div>
      )}

      <div className="text-center text-[11px] text-muted tabular-nums">
        {handsFree
          ? `자동 재생 중 · 완벽 ${knewCount} / 다시 ${retryCount}`
          : `← 다시   |   알아요 →   ·   완벽 ${knewCount} / 다시 ${retryCount}`}
      </div>
    </div>
  );
}

function ModeChip({
  active,
  onClick,
  icon,
  label,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full font-bold transition-all press-down ${
        active
          ? accent
            ? "bg-coral-500 text-white"
            : "bg-teal-400 text-ink-700"
          : "surface-subtle text-muted"
      }`}
    >
      {icon} {label} <span className="opacity-70">{active ? "ON" : "OFF"}</span>
    </button>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function CrossIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <polyline points="3 4 3 10 9 10" />
    </svg>
  );
}
