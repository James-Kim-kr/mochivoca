"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import type { Word } from "@/lib/words";
import { speak, ttsAvailable } from "@/lib/tts";
import PitchAccent from "./PitchAccent";
import Shadowing from "./Shadowing";

export interface Toggles {
  kanji: boolean;
  kana: boolean;
  meaning: boolean;
}

interface Props {
  word: Word;
  toggles: Toggles;
  autoSpeak?: boolean;
}

const KANJI_REGEX = /[一-鿿㐀-䶿]/;
function maskKanji(text: string): string {
  return text.replace(/[一-鿿㐀-䶿]/g, "◯");
}

export default function Flashcard({ word, toggles, autoSpeak = true }: Props) {
  const [flipped, setFlipped] = useState(false);
  const [shadowingOpen, setShadowingOpen] = useState(false);

  useEffect(() => {
    setFlipped(false);
    setShadowingOpen(false);
  }, [word.id]);

  useEffect(() => {
    if (autoSpeak && ttsAvailable()) {
      speak(word.kana, "ja-JP");
    }
  }, [word.id, word.kana, autoSpeak]);

  const playWord = (e: React.MouseEvent) => {
    e.stopPropagation();
    speak(word.kana, "ja-JP");
  };

  const playExample = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (word.example_reading) speak(word.example_reading, "ja-JP");
    else if (word.example_ja) speak(word.example_ja, "ja-JP");
  };

  const hasKanji = KANJI_REGEX.test(word.kanji);

  return (
    <div className="w-full relative" style={{ perspective: 1400 }}>
      <AnimatePresence>
        {shadowingOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm grid place-items-center px-4"
            onClick={() => setShadowingOpen(false)}
          >
            <motion.div
              initial={{ y: 30, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 30, scale: 0.95 }}
              className="w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <Shadowing
                kana={word.kana}
                pattern={word.pitch_pattern}
                display={word.kanji}
                onClose={() => setShadowingOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        className="card-3d relative w-full h-[22rem] cursor-pointer select-none"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => setFlipped((f) => !f)}
      >
        {/* Front */}
        <div className="face absolute inset-0 rounded-4xl surface border border-subtle shadow-card flex flex-col items-center justify-center p-7 overflow-hidden">
          {/* Subtle gradient blob */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-coral-100 dark:bg-coral-500/15 blur-2xl" />
          <div className="absolute top-3 left-5 text-[10px] font-bold uppercase tracking-[0.15em] text-coral-500">
            {word.level} {word.pos ? `· ${word.pos}` : ""}
          </div>
          <button
            onClick={playWord}
            className="absolute top-3 right-3 w-10 h-10 rounded-full surface-subtle hover:bg-coral-100 dark:hover:bg-coral-500/20 active:scale-90 grid place-items-center text-default"
            aria-label="발음 듣기"
          >
            <SpeakerIcon />
          </button>

          <div className="relative flex flex-col items-center gap-2">
            {toggles.kana && (
              <PitchAccent kana={word.kana} pattern={word.pitch_pattern} small />
            )}
            {hasKanji && toggles.kanji && toggles.kana ? (
              <ruby className="font-display text-6xl font-black text-strong leading-none">
                {word.kanji}
                <rt>{word.kana}</rt>
              </ruby>
            ) : (
              <div
                className={`font-display text-6xl font-black text-strong leading-none ${
                  toggles.kanji ? "" : "text-blur"
                }`}
              >
                {word.kanji}
              </div>
            )}
            {(!hasKanji || !toggles.kanji) && (
              <div className={`font-jp text-xl text-muted ${toggles.kana ? "" : "text-blur"}`}>
                {word.kana}
              </div>
            )}
          </div>

          <div className="absolute bottom-3 flex items-center justify-between w-full px-5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShadowingOpen(true);
              }}
              className="text-[11px] font-bold text-coral-500 px-2.5 py-1 rounded-full bg-coral-100 dark:bg-coral-500/15 press-down"
            >
              🎤 따라하기
            </button>
            <div className="text-[11px] text-faint flex items-center gap-1.5">
              <FlipHint /> 탭해서 뒤집기
            </div>
          </div>
        </div>

        {/* Back */}
        <div className="face face-back absolute inset-0 rounded-4xl surface border border-subtle shadow-card flex flex-col items-stretch p-6 overflow-hidden">
          <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-teal-100 dark:bg-teal-500/15 blur-2xl" />
          <div className="text-center mb-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-500">뜻</div>
            <div
              className={`text-3xl font-black text-strong leading-snug mt-1 ${
                toggles.meaning ? "" : "text-blur"
              }`}
            >
              {word.meaning}
            </div>
            <div className="font-jp text-sm text-muted mt-1">
              <span className={toggles.kanji ? "" : "text-blur"}>{word.kanji}</span>
              <span className="text-faint mx-1">·</span>
              <span className={toggles.kana ? "" : "text-blur"}>{word.kana}</span>
            </div>
          </div>

          {word.example_ja && (
            <div className="relative rounded-3xl surface-subtle p-4 text-left">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-coral-500">
                  예문
                </div>
                <button
                  onClick={playExample}
                  className="w-8 h-8 rounded-full surface hover:bg-coral-100 dark:hover:bg-coral-500/20 active:scale-90 grid place-items-center"
                  aria-label="예문 듣기"
                >
                  <SpeakerIcon small />
                </button>
              </div>
              <div className="font-jp text-base text-strong leading-snug">
                {toggles.kanji ? word.example_ja : maskKanji(word.example_ja)}
              </div>
              {word.example_reading && (
                <div className={`font-jp text-[11px] text-muted mt-1 ${toggles.kana ? "" : "text-blur"}`}>
                  {word.example_reading}
                </div>
              )}
              {word.example_ko && (
                <div className={`text-xs text-default mt-2 ${toggles.meaning ? "" : "text-blur"}`}>
                  {word.example_ko}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function SpeakerIcon({ small }: { small?: boolean }) {
  const s = small ? 16 : 20;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5L6 9H2v6h4l5 4z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 5a10 10 0 0 1 0 14" />
    </svg>
  );
}

function FlipHint() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <polyline points="21 4 21 10 15 10" />
    </svg>
  );
}
