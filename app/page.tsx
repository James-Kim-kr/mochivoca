"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useAppStore } from "@/lib/store";
import Mochi from "@/components/Mochi";
import { LEVEL_META, getStageCount } from "@/lib/words";
import type { JlptLevel } from "@/lib/words";

const LEVELS: JlptLevel[] = ["N5", "N4", "N3", "N2", "N1"];

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return { text: "푹 자고 있나요?", icon: "🌙" };
  if (h < 11) return { text: "좋은 아침이에요", icon: "☀️" };
  if (h < 14) return { text: "점심 잘 챙기셨어요?", icon: "🍱" };
  if (h < 18) return { text: "오후도 화이팅", icon: "🌤️" };
  if (h < 22) return { text: "저녁 학습 시간이에요", icon: "🌆" };
  return { text: "오늘도 수고했어요", icon: "🌙" };
}

export default function HomePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [hydrated, setHydrated] = useState(false);

  const level = useAppStore((s) => s.level);
  const streak = useAppStore((s) => s.streak);
  const todayCount = useAppStore((s) => s.todayCount());
  const dailyGoal = useAppStore((s) => s.dailyGoal());
  const totalXp = useAppStore((s) => s.totalXp);
  const getDailyQueue = useAppStore((s) => s.getDailyQueue);
  const unlockedDay = useAppStore((s) => s.unlockedDay);
  const isStageCompleted = useAppStore((s) => s.isStageCompleted);
  const isStageUnlocked = useAppStore((s) => s.isStageUnlocked);
  const isChallengeUnlocked = useAppStore((s) => s.isChallengeUnlocked);
  const isChallengeCompleted = useAppStore((s) => s.isChallengeCompleted);
  const levelProgress = useAppStore((s) => s.levelProgress);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    if (hydrated && !level) router.replace("/onboarding");
  }, [hydrated, level, router]);

  const g = useMemo(greeting, []);

  if (!hydrated || !level) {
    return (
      <div className="flex-1 grid place-items-center">
        <Mochi size={120} />
      </div>
    );
  }

  const remaining = getDailyQueue().length;
  const done = remaining === 0;
  const dayProgress = Math.min(100, (todayCount / dailyGoal) * 100);
  const nextDay = unlockedDay(level);
  const stageCount = getStageCount(level);
  const days = Array.from({ length: stageCount }, (_, i) => i + 1);
  const firstName = (session?.user?.name ?? "").split(" ")[0] || "친구";

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Greeting hero */}
      <header className="relative overflow-hidden rounded-4xl bg-aurora p-5 border border-subtle">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-bold text-muted">{g.icon} {g.text}</div>
            <h1 className="text-xl font-black text-strong mt-1">{firstName}님 🍡</h1>
          </div>
          <UserAvatar name={session?.user?.name ?? null} image={session?.user?.image ?? null} />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <StreakBadge streak={streak} />
          <div className="flex-1">
            <div className="flex items-end justify-between mb-1.5">
              <div className="text-[11px] font-bold text-muted">오늘 목표</div>
              <div className="text-[11px] font-extrabold text-default tabular-nums">
                {todayCount}<span className="text-faint">/{dailyGoal}</span>
              </div>
            </div>
            <div className="h-2.5 surface-subtle rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-coral-400 to-teal-400"
                initial={{ width: 0 }}
                animate={{ width: `${dayProgress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Today's mission CTA (largest tile) */}
      <Link
        href={done ? "/done" : `/study?day=${nextDay}`}
        className="relative block rounded-4xl p-5 overflow-hidden border-2 border-coral-400 bg-coral-500 text-white shadow-clay press-down"
      >
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="text-[11px] font-bold uppercase tracking-widest opacity-80">
              {done ? "오늘 학습 완료" : "오늘의 미션"}
            </div>
            <div className="text-2xl font-black mt-0.5">
              {done ? "내일 또 봐요 ✨" : `Day ${nextDay} · ${level}`}
            </div>
            <div className="text-xs opacity-90 mt-1">
              {done ? "잘했어요! 결과를 확인해보세요" : `${remaining}개 단어 · 약 10분`}
            </div>
          </div>
          <Mochi mood={done ? "happy" : "wave"} size={68} />
        </div>
      </Link>

      {/* Bento row: streak / xp / activity */}
      <div className="grid grid-cols-3 gap-3">
        <MiniTile label="총 EXP" value={totalXp} unit="" emoji="⭐" />
        <MiniTile label="연속" value={streak} unit="일" emoji="🔥" />
        <MiniTile label="완벽 암기" value={levelProgress(level).mastered} unit="개" emoji="✨" />
      </div>

      {/* Stage path - horizontal scroll */}
      <section className="rounded-4xl surface border border-subtle p-5 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="font-extrabold text-strong">{level} 학습 길</div>
          <div className="text-xs text-faint tabular-nums">
            {days.filter((d) => isStageCompleted(level, d)).length} / {stageCount}
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1 pb-1">
          {days.map((day) => {
            const completed = isStageCompleted(level, day);
            const unlocked = isStageUnlocked(level, day);
            const next = unlocked && !completed;
            const chUnlocked = isChallengeUnlocked(level, day);
            const chCompleted = isChallengeCompleted(level, day);
            const cls = completed
              ? "bg-teal-400 text-ink-700 border-teal-500"
              : next
              ? "bg-coral-500 text-white border-coral-600 shadow-clay"
              : unlocked
              ? "surface text-default border-subtle"
              : "surface-subtle text-faint border-dashed border-subtle";
            const dayContent = (
              <motion.div
                whileHover={unlocked ? { y: -3 } : {}}
                whileTap={unlocked ? { scale: 0.95 } : {}}
                className={`shrink-0 w-20 h-24 rounded-3xl border-2 grid place-items-center font-black text-sm transition-shadow ${cls}`}
              >
                <div className="text-2xl">{completed ? "⭐" : !unlocked ? "🔒" : "🍡"}</div>
                <div className="text-[11px] mt-1">Day {day}</div>
              </motion.div>
            );
            const challengeCls = chCompleted
              ? "bg-butter-300 border-butter-200 text-ink-700"
              : chUnlocked
              ? "surface border-coral-300 text-coral-500 animate-bounceSoft"
              : "surface-subtle border-dashed border-subtle text-faint";
            const challengeNode = (
              <motion.div
                whileTap={chUnlocked ? { scale: 0.95 } : {}}
                className={`shrink-0 w-16 h-24 rounded-3xl border-2 grid place-items-center transition-shadow ${challengeCls}`}
              >
                <div className="text-xl">{chCompleted ? "🏆" : chUnlocked ? "💬" : "🔒"}</div>
                <div className="text-[9px] font-black mt-1">챌린지</div>
              </motion.div>
            );
            return (
              <div key={day} className="flex items-center gap-2 shrink-0">
                {unlocked ? (
                  <Link href={`/study?day=${day}`}>{dayContent}</Link>
                ) : (
                  <div aria-disabled className="cursor-not-allowed">{dayContent}</div>
                )}
                {chUnlocked ? (
                  <Link href={`/challenge/${day}`}>{challengeNode}</Link>
                ) : (
                  <div aria-disabled className="cursor-not-allowed">{challengeNode}</div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* JLPT level progress */}
      <section className="rounded-4xl surface border border-subtle p-5 shadow-card">
        <div className="font-extrabold text-strong text-sm mb-3">JLPT 레벨별 진척도</div>
        <div className="flex flex-col gap-2.5">
          {LEVELS.map((lv) => {
            const meta = LEVEL_META[lv];
            const prog = meta.ready ? levelProgress(lv) : { mastered: 0, total: meta.total, seen: 0 };
            const pct = prog.total > 0 ? (prog.mastered / prog.total) * 100 : 0;
            return (
              <div key={lv} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-xl grid place-items-center font-black text-white text-[11px] ${
                    meta.ready ? "bg-coral-500" : "bg-ink-300/40"
                  }`}
                >
                  {lv}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[10.5px] mb-1">
                    <span className="font-bold text-muted">
                      {meta.ready ? `${prog.mastered}/${prog.total}` : "준비 중"}
                    </span>
                    <span className="font-extrabold text-default tabular-nums">
                      {meta.ready ? `${Math.round(pct)}%` : "—"}
                    </span>
                  </div>
                  <div className="h-1.5 surface-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-coral-400 to-teal-400"
                      style={{ width: meta.ready ? `${pct}%` : 0 }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function MiniTile({ label, value, unit, emoji }: { label: string; value: number; unit: string; emoji: string }) {
  return (
    <div className="rounded-3xl surface border border-subtle p-3 shadow-card">
      <div className="text-lg">{emoji}</div>
      <div className="font-black text-strong leading-none mt-2 tabular-nums">
        <span className="text-xl">{value}</span>
        {unit && <span className="text-xs text-muted ml-0.5">{unit}</span>}
      </div>
      <div className="text-[10.5px] font-bold text-muted mt-1">{label}</div>
    </div>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl bg-coral-500 text-white px-3 py-2 shadow-clay">
      <span>🔥</span>
      <span className="font-black text-base tabular-nums leading-none">{streak}</span>
      <span className="text-[11px] font-bold opacity-90 leading-none">일</span>
    </div>
  );
}

function UserAvatar({ name, image }: { name: string | null; image: string | null }) {
  const initial = (name ?? "?").slice(0, 1).toUpperCase();
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name ?? ""}
        className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-card"
      />
    );
  }
  return (
    <div className="w-11 h-11 rounded-full bg-coral-200 grid place-items-center text-coral-700 font-black border-2 border-white shadow-card">
      {initial}
    </div>
  );
}
