"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Mochi from "./Mochi";
import type { Word } from "@/lib/words";
import type { RedPenResult } from "@/app/api/llm/redpen/route";

interface Props {
  word: Word;
  onComplete: (success: boolean) => void;
}

export default function RedPenWriting({ word, onComplete }: Props) {
  const [sentence, setSentence] = useState("");
  const [result, setResult] = useState<RedPenResult | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy || !sentence.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/llm/redpen", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          target_word: { kanji: word.kanji, kana: word.kana, meaning: word.meaning },
          sentence,
        }),
      });
      const data: RedPenResult = await res.json();
      setResult(data);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Target word */}
      <div className="rounded-3xl surface border border-subtle shadow-card p-5 text-center">
        <div className="text-[10px] font-bold uppercase tracking-widest text-coral-500">오늘의 단어</div>
        <div className="font-display text-4xl font-black text-strong mt-1">{word.kanji}</div>
        <div className="font-jp text-sm text-muted">{word.kana}</div>
        <div className="text-xs text-default mt-1">{word.meaning}</div>
      </div>

      {/* Input */}
      <div className="rounded-3xl surface border border-subtle shadow-card p-4">
        <div className="text-[11px] font-bold text-muted mb-2">
          이 단어를 사용해서 일본어 문장을 자유롭게 써보세요
        </div>
        <textarea
          value={sentence}
          onChange={(e) => setSentence(e.target.value)}
          placeholder={`예: ${word.example_ja ?? "私は…"}`}
          rows={3}
          disabled={busy}
          className="w-full surface-subtle rounded-2xl px-3 py-2.5 font-jp text-base outline-none focus:bg-white dark:focus:bg-ink-700 disabled:opacity-50"
        />
        <div className="flex justify-between items-center mt-2 text-[10px] text-faint">
          <span>{sentence.length}자</span>
          <span>Enter로 줄바꿈 · 버튼으로 제출</span>
        </div>
        <button
          onClick={submit}
          disabled={!sentence.trim() || busy}
          className="btn-clay w-full mt-3 bg-coral-500 text-white disabled:opacity-50"
        >
          {busy ? "모찌가 첨삭 중..." : "✏️ 첨삭 받기"}
        </button>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-3xl surface border border-subtle shadow-card p-4"
          >
            <div className="flex items-start gap-3">
              <Mochi mood={result.score >= 4 ? "happy" : "idle"} size={56} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-coral-500 text-lg">
                    {"⭐".repeat(result.score)}
                    <span className="text-faint">{"☆".repeat(5 - result.score)}</span>
                  </span>
                </div>
                <div className="text-sm font-extrabold text-strong mt-1">{result.praise}</div>
              </div>
            </div>

            {result.corrected && (
              <div className="mt-3 rounded-2xl bg-teal-100 dark:bg-teal-500/15 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-teal-600 dark:text-teal-300 mb-1">
                  문법 다듬기
                </div>
                <div className="font-jp text-sm text-strong">{result.corrected}</div>
              </div>
            )}

            {result.natural_alternative && (
              <div className="mt-2 rounded-2xl bg-coral-50 dark:bg-coral-500/10 p-3">
                <div className="text-[10px] font-bold uppercase tracking-widest text-coral-600 dark:text-coral-300 mb-1">
                  더 자연스러운 표현
                </div>
                <div className="font-jp text-sm text-strong">{result.natural_alternative}</div>
              </div>
            )}

            <div className="mt-3 rounded-2xl surface-subtle p-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">뉘앙스 팁</div>
              <div className="text-xs text-default">{result.nuance_tip}</div>
            </div>

            <button
              onClick={() => onComplete(result.score >= 3)}
              className="btn-clay w-full mt-4 surface text-default border-2 border-subtle"
            >
              완료
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
