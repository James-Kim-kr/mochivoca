"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useAppStore, dayKey } from "@/lib/store";
import Heatmap from "@/components/Heatmap";
import Mochi from "@/components/Mochi";
import { useStoreReady } from "@/components/SessionGate";
import { N5_WORDS } from "@/lib/words";
import type { Word } from "@/lib/words";
import { speak } from "@/lib/tts";

export default function MePage() {
  const { data: session } = useSession();
  const [hydrated, setHydrated] = useState(false);

  const streak = useAppStore((s) => s.streak);
  const streakFreezeCount = useAppStore((s) => s.streakFreezeCount);
  const todayCompleted = useAppStore((s) => s.todayCompleted);
  const dailyLogs = useAppStore((s) => s.dailyLogs);
  const level = useAppStore((s) => s.level);
  const levelProgress = useAppStore((s) => s.levelProgress);
  const dailyGoal = useAppStore((s) => s.dailyGoal());
  const todayCount = useAppStore((s) => s.todayCount());
  const weakWords = useAppStore((s) => s.weakWords);
  const cards = useAppStore((s) => s.cards);

  const ready = useStoreReady();

  // Resolve weak word IDs to actual Word objects, drop unknown ones,
  // and split into "still struggling" vs "overcome" (SRS box >= 5).
  const wordById = new Map<string, Word>(N5_WORDS.map((w) => [w.id, w]));
  const weakEntries = Object.values(weakWords)
    .filter((w) => w.wrongCount > 0)
    .map((w) => ({ weak: w, word: wordById.get(w.wordId), box: cards[w.wordId]?.box ?? 0 }))
    .filter((x) => !!x.word) as { weak: typeof weakWords[string]; word: Word; box: number }[];
  const stillWeak = weakEntries.filter((x) => x.box < 5).sort((a, b) => b.weak.wrongCount - a.weak.wrongCount);
  const overcome = weakEntries.filter((x) => x.box >= 5);

  useEffect(() => setHydrated(true), []);

  if (!hydrated || !ready) {
    return <div className="flex-1 grid place-items-center"><Mochi size={120} /></div>;
  }

  const today = dayKey();
  const log = dailyLogs[today] ?? { newCount: 0, reviewCount: 0, wrongCount: 0 };
  const todayTotal = log.newCount + log.reviewCount;
  const accuracy = todayTotal > 0 ? Math.round(((todayTotal - log.wrongCount) / todayTotal) * 100) : 0;
  const totalReviewed = Object.values(todayCompleted).reduce((s, v) => s + v, 0);
  const activeDays = Object.values(todayCompleted).filter((v) => v > 0).length;
  const prog = level ? levelProgress(level) : { mastered: 0, total: 0, seen: 0 };
  const goalPct = Math.min(100, (todayCount / dailyGoal) * 100);

  return (
    <div className="flex-1 flex flex-col gap-4">
      <h1 className="text-2xl font-black text-strong">통계</h1>

      {/* Profile */}
      <div className="rounded-4xl surface border border-subtle p-4 shadow-card flex items-center gap-4">
        {session?.user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt=""
            className="w-14 h-14 rounded-full object-cover border-2 border-coral-200"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-coral-200 grid place-items-center text-coral-700 font-black text-lg">
            {(session?.user?.name ?? "?").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-base font-extrabold text-strong truncate">
            {session?.user?.name ?? "사용자"}
          </div>
          <div className="text-[11px] text-faint truncate">{session?.user?.email}</div>
          <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-coral-500 bg-coral-100 dark:bg-coral-500/15 px-2 py-0.5 rounded-full">
            {level ?? "—"} 코스
          </div>
        </div>
      </div>

      {/* Goal ring + key stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-3xl surface border border-subtle p-3 shadow-card flex flex-col items-center">
          <GoalRing pct={goalPct} value={todayCount} max={dailyGoal} />
          <div className="text-[10px] font-bold text-muted mt-1.5">오늘 목표</div>
        </div>
        <Stat emoji="🔥" label="연속 학습" value={`${streak}`} unit="일" />
        <Stat emoji="📅" label="활동 일수" value={`${activeDays}`} unit="일" />
      </div>

      {/* Heatmap */}
      <section className="rounded-4xl surface border border-subtle p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="font-extrabold text-strong">학습 잔디</div>
          <div className="flex items-center gap-1 text-[10px] text-faint">
            적음
            <span className="w-2.5 h-2.5 rounded-sm bg-ink-100 dark:bg-ink-700" />
            <span className="w-2.5 h-2.5 rounded-sm bg-teal-100 dark:bg-teal-500/30" />
            <span className="w-2.5 h-2.5 rounded-sm bg-teal-200 dark:bg-teal-500/50" />
            <span className="w-2.5 h-2.5 rounded-sm bg-teal-400" />
            <span className="w-2.5 h-2.5 rounded-sm bg-teal-600 dark:bg-teal-300" />
            많음
          </div>
        </div>
        <Heatmap data={todayCompleted} weeks={14} />
        <div className="text-[11px] text-muted mt-3 text-center tabular-nums">
          누적 <span className="font-extrabold text-default">{totalReviewed}</span>개 완벽 암기
        </div>
      </section>

      {/* Today's log */}
      <section className="rounded-4xl surface border border-subtle p-5 shadow-card">
        <div className="font-extrabold text-strong mb-3">오늘의 학습 기록</div>
        <div className="grid grid-cols-3 gap-3">
          <Mini label="새 단어" value={`${log.newCount}`} unit="개" />
          <Mini label="복습" value={`${log.reviewCount}`} unit="개" />
          <Mini label="정답률" value={`${accuracy}`} unit="%" />
        </div>
        {todayTotal === 0 && (
          <div className="mt-4 rounded-2xl bg-coral-50 dark:bg-coral-500/10 border border-coral-200 dark:border-coral-500/30 px-3 py-3 text-center">
            <div className="text-coral-600 dark:text-coral-300 text-xs font-bold">
              아직 오늘 학습한 기록이 없어요
            </div>
            <Link
              href="/"
              className="inline-block mt-2 text-[11px] font-extrabold text-coral-500 underline"
            >
              지금 시작하기 →
            </Link>
          </div>
        )}
      </section>

      {/* Level mastery */}
      {level && prog.total > 0 && (
        <section className="rounded-4xl surface border border-subtle p-5 shadow-card">
          <div className="flex items-center justify-between mb-2">
            <div className="font-extrabold text-strong">{level} 마스터 현황</div>
            <div className="text-xs font-extrabold text-coral-500 tabular-nums">
              {Math.round((prog.mastered / prog.total) * 100)}%
            </div>
          </div>
          <div className="text-[11px] text-muted mb-2">
            완벽 <span className="font-bold text-default">{prog.mastered}</span> · 학습 중{" "}
            <span className="font-bold text-default">{prog.seen - prog.mastered}</span> · 전체{" "}
            <span className="font-bold text-default">{prog.total}</span>
          </div>
          <div className="h-2.5 surface-subtle rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-coral-400 to-teal-400"
              initial={{ width: 0 }}
              animate={{ width: `${(prog.mastered / prog.total) * 100}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
        </section>
      )}

      {/* Weak words + streak freeze */}
      <section className="rounded-4xl surface border border-subtle p-5 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-extrabold text-strong">약점 단어</div>
            <div className="text-[10px] text-muted mt-0.5">
              아직 어려운 {stillWeak.length}개
              {overcome.length > 0 && <span className="text-teal-500 font-bold"> · 극복한 {overcome.length}개</span>}
            </div>
          </div>
          <div className="text-[10px] font-bold text-coral-500 bg-coral-100 dark:bg-coral-500/15 px-2 py-1 rounded-full">
            ❄️ 스트릭 프리즈 {streakFreezeCount}개
          </div>
        </div>

        {stillWeak.length === 0 && overcome.length === 0 ? (
          <div className="text-[11px] text-muted text-center py-4">
            아직 약점 단어가 없어요. 멋져요! 🌱
          </div>
        ) : (
          <>
            {stillWeak.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {stillWeak.slice(0, 8).map(({ weak, word }) => {
                  const intensity = Math.min(3, weak.wrongCount);
                  const tone =
                    intensity >= 3 ? "bg-coral-500 text-white"
                    : intensity === 2 ? "bg-coral-300 text-ink-700"
                    : "bg-coral-100 dark:bg-coral-500/15 text-coral-700 dark:text-coral-300";
                  return (
                    <button
                      key={weak.wordId}
                      onClick={() => speak(word.kana, "ja-JP", { rate: 0.85 })}
                      className="flex items-center gap-3 rounded-2xl surface-subtle p-2.5 press-down text-left"
                    >
                      <div className={`shrink-0 w-9 h-9 rounded-xl grid place-items-center font-black text-xs ${tone}`}>
                        ×{weak.wrongCount}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="font-display text-base font-black text-strong truncate">{word.kanji}</span>
                          <span className="font-jp text-[11px] text-muted truncate">{word.kana}</span>
                        </div>
                        <div className="text-[11px] text-default truncate">{word.meaning}</div>
                      </div>
                      <span className="text-faint text-base">🔊</span>
                    </button>
                  );
                })}
                {stillWeak.length > 8 && (
                  <div className="text-[10px] text-faint text-center mt-1">
                    +{stillWeak.length - 8}개 더 (가장 많이 틀린 8개 표시 중)
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[11px] text-muted text-center py-3">
                현재 어려운 단어가 없어요 ✨
              </div>
            )}

            {overcome.length > 0 && (
              <div className="mt-3 pt-3 border-t border-subtle">
                <div className="text-[10px] font-bold uppercase tracking-widest text-teal-500 mb-2">극복한 단어</div>
                <div className="flex flex-wrap gap-1.5">
                  {overcome.slice(0, 12).map(({ weak, word }) => (
                    <div
                      key={weak.wordId}
                      className="px-2.5 py-1 rounded-xl bg-teal-100 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300 text-[11px] font-bold flex items-center gap-1"
                    >
                      <span className="font-jp">{word.kanji}</span>
                      <span className="opacity-60">✓</span>
                    </div>
                  ))}
                  {overcome.length > 12 && (
                    <span className="text-[10px] text-teal-500 self-center">+{overcome.length - 12}</span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Achievement chips */}
      <section className="rounded-4xl surface border border-subtle p-5 shadow-card">
        <div className="font-extrabold text-strong mb-3">업적</div>
        <div className="flex flex-wrap gap-2">
          <Achievement unlocked={streak >= 1} emoji="🌱" label="첫걸음" />
          <Achievement unlocked={streak >= 3} emoji="🔥" label="3일 연속" />
          <Achievement unlocked={streak >= 7} emoji="🌟" label="일주일 완주" />
          <Achievement unlocked={totalReviewed >= 50} emoji="📚" label="단어 50개" />
          <Achievement unlocked={totalReviewed >= 100} emoji="🎓" label="단어 100개" />
          <Achievement unlocked={prog.mastered >= 30} emoji="🏆" label="마스터 30" />
        </div>
      </section>
    </div>
  );
}

function Stat({ emoji, label, value, unit }: { emoji: string; label: string; value: string; unit: string }) {
  return (
    <div className="rounded-3xl surface border border-subtle p-3 shadow-card text-center">
      <div className="text-lg">{emoji}</div>
      <div className="font-black text-strong tabular-nums mt-2">
        <span className="text-xl">{value}</span>
        <span className="text-xs text-muted ml-0.5">{unit}</span>
      </div>
      <div className="text-[10px] font-bold text-muted mt-1">{label}</div>
    </div>
  );
}

function Mini({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-2xl surface-subtle p-3 text-center">
      <div className="text-[10px] font-bold text-muted">{label}</div>
      <div className="font-black text-strong mt-0.5 tabular-nums">
        <span className="text-xl">{value}</span>
        <span className="text-xs text-muted ml-0.5">{unit}</span>
      </div>
    </div>
  );
}

function Achievement({ unlocked, emoji, label }: { unlocked: boolean; emoji: string; label: string }) {
  return (
    <div
      className={`rounded-2xl px-3 py-2 flex items-center gap-1.5 ${
        unlocked
          ? "bg-coral-100 dark:bg-coral-500/15 text-coral-600 dark:text-coral-300"
          : "surface-subtle text-faint"
      }`}
    >
      <span className={unlocked ? "" : "grayscale opacity-40"}>{emoji}</span>
      <span className="text-[11px] font-extrabold">{label}</span>
    </div>
  );
}

function GoalRing({ pct, value, max }: { pct: number; value: number; max: number }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return (
    <div className="relative w-14 h-14">
      <svg width="56" height="56" className="rotate-[-90deg]">
        <circle cx="28" cy="28" r={r} stroke="currentColor" strokeWidth="6" fill="none" className="text-ink-100 dark:text-ink-700" />
        <motion.circle
          cx="28"
          cy="28"
          r={r}
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          className="text-coral-500"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-[10px] font-extrabold text-strong tabular-nums">
        {value}/{max}
      </div>
    </div>
  );
}
