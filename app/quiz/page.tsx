"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { getWordsByLevel } from "@/lib/words";
import { buildQuiz, quizScore, QuizQuestion } from "@/lib/quiz";
import { useTimer } from "@/lib/timer";
import Mochi from "@/components/Mochi";
import { speak } from "@/lib/tts";

const QUESTION_MS = 10_000;
const QUESTIONS = 10;

type Phase = "intro" | "running" | "done";

export default function QuizPage() {
  const router = useRouter();
  const level = useAppStore((s) => s.level);
  const cards = useAppStore((s) => s.cards);
  const recordQuiz = useAppStore((s) => s.recordQuiz);
  const [phase, setPhase] = useState<Phase>("intro");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  const questions = useMemo<QuizQuestion[]>(() => {
    if (!level) return [];
    const all = getWordsByLevel(level);
    const seen = all.filter((w) => cards[w.id]);
    const pool = seen.length >= 5 ? all : all; // prefer seen words but always include all for variety
    return buildQuiz(pool, QUESTIONS);
  }, [level, cards, phase]);

  if (!hydrated) return <div className="flex-1 grid place-items-center"><Mochi size={120} /></div>;

  if (!level) {
    return (
      <div className="flex-1 grid place-items-center text-center">
        <div className="rounded-3xl surface border border-subtle p-6 max-w-sm">
          <div className="font-extrabold text-strong">먼저 레벨을 선택해주세요</div>
          <button onClick={() => router.push("/onboarding")} className="btn-clay mt-3 bg-coral-500 text-white">
            온보딩으로
          </button>
        </div>
      </div>
    );
  }

  if (phase === "intro") {
    return (
      <div className="flex-1 flex flex-col gap-4">
        <header className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="w-10 h-10 rounded-full surface border border-subtle text-default grid place-items-center press-down"
          >
            ←
          </button>
          <div>
            <div className="text-[11px] font-bold text-coral-500 uppercase tracking-widest">실전 모의고사</div>
            <h1 className="text-2xl font-black text-strong">⚡ 타임어택</h1>
          </div>
        </header>

        <div className="rounded-4xl bg-aurora border border-subtle p-5">
          <div className="flex items-start gap-3">
            <Mochi mood="wave" size={84} />
            <div className="flex-1">
              <div className="text-xs font-bold text-coral-500">JLPT {level} · 10문제</div>
              <div className="font-extrabold text-strong text-base mt-1">
                10초 안에 답을 맞춰보세요!
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl surface border border-subtle p-4 shadow-card">
          <div className="text-[10px] font-bold uppercase tracking-widest text-coral-500 mb-2">규칙</div>
          <ul className="text-sm text-default space-y-1.5">
            <li>· 문제당 <b>10초</b> 제한</li>
            <li>· <b>한자 → 히라가나</b> 또는 <b>문맥 공란 채우기</b> (4지선다)</li>
            <li>· 연속 정답 시 <b>콤보 보너스</b></li>
            <li>· 완료 시 점수만큼 <b>주간 EXP</b>가 적립돼 리그 순위에 반영돼요</li>
          </ul>
        </div>

        <button
          onClick={() => setPhase("running")}
          className="btn-clay mt-auto bg-coral-500 text-white text-lg"
        >
          🚀 시작하기
        </button>
      </div>
    );
  }

  if (phase === "running") {
    return <RunningQuiz questions={questions} onDone={(score, combo) => { recordQuiz(score, combo); setPhase("done"); }} onExit={() => router.push("/")} />;
  }

  return <QuizDone onAgain={() => setPhase("running")} onHome={() => router.push("/")} />;
}

function RunningQuiz({
  questions,
  onDone,
  onExit,
}: {
  questions: QuizQuestion[];
  onDone: (score: number, bestCombo: number) => void;
  onExit: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [totalMs, setTotalMs] = useState(0);
  const [comboBurst, setComboBurst] = useState(0);
  const q = questions[idx];
  const startRef = useRef<number>(Date.now());

  const { progress, secondsLeft } = useTimer({
    duration: QUESTION_MS,
    running: picked === null,
    key: idx,
    onTimeout: () => handlePick(-1),
  });

  function handlePick(choiceIdx: number) {
    if (picked !== null) return;
    setPicked(choiceIdx);
    const elapsed = Date.now() - startRef.current;
    setTotalMs((m) => m + elapsed);
    const isCorrect = choiceIdx === q.correctIndex;
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      const newCombo = combo + 1;
      setCombo(newCombo);
      setBestCombo((b) => Math.max(b, newCombo));
      if (newCombo >= 3) setComboBurst(newCombo);
      try { speak(q.word.kana, "ja-JP", { rate: 0.9 }); } catch {}
    } else {
      setCombo(0);
    }
    setTimeout(() => {
      if (idx + 1 >= questions.length) {
        const avg = totalMs / Math.max(1, idx + 1);
        const score = quizScore(correctCount + (isCorrect ? 1 : 0), Math.max(bestCombo, isCorrect ? combo + 1 : combo), avg);
        onDone(score, Math.max(bestCombo, isCorrect ? combo + 1 : combo));
      } else {
        setIdx((i) => i + 1);
        setPicked(null);
        startRef.current = Date.now();
      }
    }, 900);
  }

  if (!q) {
    return (
      <div className="flex-1 grid place-items-center text-center">
        <div className="rounded-3xl surface border border-subtle p-6">
          <div className="font-extrabold text-strong">문제를 생성할 수 없어요</div>
          <div className="text-xs text-muted mt-1">단어를 좀 더 학습한 다음 시도해주세요</div>
          <button onClick={onExit} className="btn-clay mt-3 bg-coral-500 text-white">홈으로</button>
        </div>
      </div>
    );
  }

  const timerColor = progress > 0.4 ? "from-teal-400 to-coral-400" : "from-coral-400 to-coral-600";

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <button onClick={onExit} className="w-10 h-10 rounded-full surface border border-subtle grid place-items-center press-down">
          ✕
        </button>
        <div className="flex-1 h-3 surface-subtle rounded-full overflow-hidden relative">
          <motion.div
            className={`h-full bg-gradient-to-r ${timerColor}`}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>
        <div className="text-sm font-extrabold tabular-nums w-10 text-right text-default">
          {secondsLeft}s
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-muted tabular-nums">
          {idx + 1} / {questions.length}
        </div>
        <ComboBadge combo={combo} />
      </div>

      {/* Question */}
      <div className="rounded-4xl surface border border-subtle shadow-card p-6 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-coral-100 dark:bg-coral-500/15 blur-2xl" />
        <div className="text-[10px] font-bold uppercase tracking-widest text-coral-500 mb-3">
          {q.type === "kanji-to-kana" ? "올바른 읽기는?" : "공란에 들어갈 단어는?"}
        </div>
        {q.type === "kanji-to-kana" ? (
          <div className="font-display text-7xl font-black text-strong text-center my-5">
            {q.prompt}
          </div>
        ) : (
          <div className="font-jp text-2xl font-bold text-strong leading-snug my-3 text-center">
            {q.prompt}
          </div>
        )}
        {q.hint && <div className="text-xs text-muted text-center">힌트: {q.hint}</div>}
      </div>

      {/* Choices */}
      <div className="grid grid-cols-2 gap-2.5">
        {q.choices.map((c, i) => {
          const isCorrect = i === q.correctIndex;
          const isPicked = picked === i;
          const showState = picked !== null;
          let cls = "surface text-default border-subtle";
          if (showState) {
            if (isCorrect) cls = "bg-teal-400 text-ink-700 border-teal-500";
            else if (isPicked) cls = "bg-coral-500 text-white border-coral-600";
            else cls = "surface-subtle text-faint border-subtle";
          }
          return (
            <button
              key={i}
              onClick={() => handlePick(i)}
              disabled={picked !== null}
              className={`rounded-2xl border-2 py-4 px-3 font-jp text-lg font-bold press-down transition-colors ${cls}`}
            >
              {c}
            </button>
          );
        })}
      </div>

      <ComboBurst count={comboBurst} onDone={() => setComboBurst(0)} />
    </div>
  );
}

function ComboBadge({ combo }: { combo: number }) {
  if (combo < 2) return <div className="text-[10px] text-faint">콤보 0</div>;
  return (
    <motion.div
      key={combo}
      initial={{ scale: 0.5, y: -8 }}
      animate={{ scale: 1, y: 0 }}
      className="px-2.5 py-1 rounded-full bg-coral-500 text-white text-[11px] font-black flex items-center gap-1"
    >
      🔥 {combo} 콤보
    </motion.div>
  );
}

function ComboBurst({ count, onDone }: { count: number; onDone: () => void }) {
  useEffect(() => {
    if (count === 0) return;
    const id = setTimeout(onDone, 900);
    return () => clearTimeout(id);
  }, [count, onDone]);
  return (
    <AnimatePresence>
      {count >= 3 && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0.5, 1.3, 1], opacity: [0, 1, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9 }}
          className="fixed inset-0 z-30 grid place-items-center pointer-events-none"
        >
          <div className="text-7xl font-black text-coral-500 drop-shadow-lg">
            {count}×
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function QuizDone({ onAgain, onHome }: { onAgain: () => void; onHome: () => void }) {
  const score = useAppStore((s) => s.bestQuizScore);
  const combo = useAppStore((s) => s.bestCombo);
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, -8, 8, 0] }} transition={{ type: "spring" }}>
        <Mochi mood="happy" size={140} />
      </motion.div>
      <h2 className="text-2xl font-black text-strong">완료!</h2>
      <div className="grid grid-cols-2 gap-3 w-full">
        <div className="rounded-3xl surface border border-subtle p-3 shadow-card">
          <div className="text-[10px] font-bold text-muted">최고 점수</div>
          <div className="text-2xl font-black text-strong tabular-nums">{score}</div>
        </div>
        <div className="rounded-3xl surface border border-subtle p-3 shadow-card">
          <div className="text-[10px] font-bold text-muted">최고 콤보</div>
          <div className="text-2xl font-black text-strong tabular-nums">🔥 {combo}</div>
        </div>
      </div>
      <button onClick={onAgain} className="btn-clay bg-coral-500 text-white w-full mt-2">
        한 번 더
      </button>
      <button onClick={onHome} className="btn-clay surface text-default border-2 border-subtle w-full">
        홈으로
      </button>
    </div>
  );
}
