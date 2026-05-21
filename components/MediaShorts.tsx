"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Word } from "@/lib/words";
import { speak, cancelSpeech } from "@/lib/tts";

interface Props {
  word: Word;
  open: boolean;
  onClose: () => void;
}

// Mock "shorts" — rotating mini-scenes that feature the target word.
const SCENES: { genre: string; emoji: string; ja: (w: Word) => string; ko: (w: Word) => string }[] = [
  {
    genre: "뉴스",
    emoji: "📺",
    ja: (w) => `今夜のニュース：${w.kanji}について…`,
    ko: (w) => `오늘 밤 뉴스: '${w.meaning}'에 대하여…`,
  },
  {
    genre: "드라마",
    emoji: "🎬",
    ja: (w) => `…ねえ、${w.kanji}って、本当にあるの？`,
    ko: (w) => `…있잖아, '${w.meaning}'(이)란 거 정말 있어?`,
  },
  {
    genre: "애니",
    emoji: "🍥",
    ja: (w) => `${w.kanji}！俺、絶対あきらめないぞ！`,
    ko: (w) => `'${w.meaning}'! 난 절대 포기 안 해!`,
  },
  {
    genre: "예능",
    emoji: "🎤",
    ja: (w) => `次のお題は…${w.kanji}！`,
    ko: (w) => `다음 주제는… '${w.meaning}'!`,
  },
];

export default function MediaShorts({ word, open, onClose }: Props) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [t, setT] = useState(0);

  useEffect(() => {
    if (!open) return;
    setSceneIdx(0);
    setT(0);
    let frame = 0;
    const loopDurationMs = 3000;
    const interval = setInterval(() => {
      frame += 100;
      setT((frame % loopDurationMs) / loopDurationMs);
      if (frame % loopDurationMs === 0) {
        setSceneIdx((i) => (i + 1) % SCENES.length);
        speak(word.kana, "ja-JP", { rate: 0.85 });
      }
    }, 100);
    speak(word.kana, "ja-JP", { rate: 0.85 });
    return () => {
      clearInterval(interval);
      cancelSpeech();
    };
  }, [open, word.kana]);

  const scene = SCENES[sceneIdx];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm grid place-items-center px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, scale: 0.95 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 30, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm"
          >
            {/* "Video" frame */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-ink-700 to-ink-900 aspect-[9/16] max-h-[70vh] shadow-card">
              {/* Animated background blobs */}
              <motion.div
                className="absolute inset-0"
                animate={{
                  background: [
                    "radial-gradient(60% 60% at 30% 30%, rgba(255,107,71,0.5), transparent 60%)",
                    "radial-gradient(60% 60% at 70% 60%, rgba(63,199,165,0.5), transparent 60%)",
                    "radial-gradient(60% 60% at 30% 70%, rgba(245,165,36,0.5), transparent 60%)",
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />

              {/* Genre chip */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur text-white text-[10px] font-extrabold uppercase tracking-widest">
                {scene.emoji} {scene.genre}
              </div>

              {/* Live indicator */}
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-coral-500 text-white text-[10px] font-extrabold">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LOOP
              </div>

              {/* Subtitle box */}
              <div className="absolute inset-x-3 bottom-16 rounded-2xl bg-black/55 backdrop-blur p-3 text-white">
                <motion.div
                  key={sceneIdx}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="font-jp text-lg font-extrabold leading-snug"
                >
                  {scene.ja(word)}
                </motion.div>
                <motion.div
                  key={`ko-${sceneIdx}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-xs text-white/80 mt-1"
                >
                  {scene.ko(word)}
                </motion.div>
              </div>

              {/* Word pill */}
              <div className="absolute inset-x-0 bottom-3 px-3">
                <div className="rounded-2xl bg-white/95 text-ink-700 p-3 flex items-center justify-between">
                  <div>
                    <div className="font-display text-xl font-black">{word.kanji}</div>
                    <div className="font-jp text-[11px] text-ink-500">{word.kana} · {word.meaning}</div>
                  </div>
                  <button
                    onClick={() => speak(word.kana, "ja-JP", { rate: 0.85 })}
                    className="w-9 h-9 rounded-full bg-coral-500 text-white grid place-items-center active:scale-90"
                    aria-label="발음 다시 듣기"
                  >
                    🔊
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="absolute top-0 inset-x-0 h-1 bg-white/10">
                <div
                  className="h-full bg-coral-400 transition-[width]"
                  style={{ width: `${t * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-clay w-full mt-3 surface text-default border-2 border-subtle"
            >
              닫기
            </button>
            <div className="text-[10px] text-white/60 text-center mt-2">
              ※ 데모용 가상 미디어 클립입니다
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
