"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore, nextWeekStartTs } from "@/lib/store";
import { generateLeague, PROMOTION_RANK, DEMOTION_MIN_RANK, tierMeta } from "@/lib/league";
import { useCountdown } from "@/lib/timer";
import Mochi from "@/components/Mochi";
import { useStoreReady } from "@/components/SessionGate";

export default function LeaguePage() {
  const router = useRouter();
  const userKey = useAppStore((s) => s.userKey);
  const league = useAppStore((s) => s.league);
  const rolloverWeekIfNeeded = useAppStore((s) => s.rolloverWeekIfNeeded);
  const [hydrated, setHydrated] = useState(false);
  const ready = useStoreReady();

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (hydrated && ready) rolloverWeekIfNeeded();
  }, [hydrated, ready, rolloverWeekIfNeeded]);

  const members = useMemo(
    () => generateLeague(league.weekStart, league.tier, userKey, league.weeklyXp),
    [league.weekStart, league.tier, league.weeklyXp, userKey]
  );

  const me = members.find((m) => m.is_me);
  const { d, h, m, s } = useCountdown(nextWeekStartTs(league.weekStart));
  const meta = tierMeta(league.tier);

  const promotionThreshold = members[PROMOTION_RANK - 1]?.exp ?? 0;
  const promoteDelta = Math.max(0, promotionThreshold - (me?.exp ?? 0) + 1);

  if (!hydrated || !ready) return <div className="flex-1 grid place-items-center"><Mochi size={120} /></div>;

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/")} className="w-10 h-10 rounded-full surface border border-subtle text-default grid place-items-center press-down">
          ←
        </button>
        <div>
          <div className="text-[11px] font-bold text-coral-500 uppercase tracking-widest">Mochi League</div>
          <h1 className="text-2xl font-black text-strong">모찌 리그</h1>
        </div>
      </div>

      {/* Tier hero */}
      <div className="rounded-4xl bg-aurora border border-subtle p-5">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-3xl grid place-items-center text-3xl shadow-clay"
            style={{ background: meta.color + "22", border: `2px solid ${meta.color}` }}
          >
            {meta.emoji}
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: meta.color }}>
              {meta.label} 리그
            </div>
            <div className="text-2xl font-black text-strong">
              내 순위 #{me?.rank ?? "-"}
            </div>
            <div className="text-xs text-muted">
              주간 EXP <span className="font-extrabold text-default">{me?.exp ?? 0}</span>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
          <span>다음 정산까지</span>
          <span className="font-extrabold text-default tabular-nums">
            {d}일 {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
          </span>
        </div>
      </div>

      {/* Status hints */}
      {me && me.rank > PROMOTION_RANK && (
        <div className="rounded-2xl surface border border-subtle p-3 shadow-card text-xs text-default">
          🎯 승급까지 <b className="text-coral-500 tabular-nums">+{promoteDelta} EXP</b>{" "}
          더 모으면 5위권 진입!
        </div>
      )}
      {me && me.rank >= DEMOTION_MIN_RANK && (
        <div className="rounded-2xl bg-coral-50 dark:bg-coral-500/10 border border-coral-200 dark:border-coral-500/30 p-3 text-xs text-coral-700 dark:text-coral-300">
          ⚠️ 강등권이에요! 학습/퀴즈로 EXP를 더 모아야 해요.
        </div>
      )}

      {/* Leaderboard */}
      <div className="rounded-4xl surface border border-subtle shadow-card p-2 overflow-hidden">
        {/* Promotion zone label */}
        <ZoneLabel color="bg-teal-100 dark:bg-teal-500/20" text="text-teal-700 dark:text-teal-300" label={`승급권 · 상위 ${PROMOTION_RANK}명`} />
        <div className="flex flex-col">
          <AnimatePresence initial={false}>
            {members.map((mb, i) => {
              const showDemotionLine = i + 1 === DEMOTION_MIN_RANK;
              return (
                <motion.div
                  key={mb.user_id}
                  layout
                  transition={{ type: "spring", stiffness: 280, damping: 28 }}
                >
                  {showDemotionLine && (
                    <ZoneLabel
                      color="bg-coral-50 dark:bg-coral-500/15"
                      text="text-coral-600 dark:text-coral-300"
                      label={`강등권 · 하위 5명`}
                    />
                  )}
                  <Row
                    rank={mb.rank}
                    nickname={mb.nickname}
                    exp={mb.exp}
                    isMe={mb.is_me}
                    inPromotion={mb.rank <= PROMOTION_RANK}
                    inDemotion={mb.rank >= DEMOTION_MIN_RANK}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <div className="text-[10px] text-faint text-center">
        ※ 다른 참가자는 데모 데이터입니다 (백엔드 연결 시 자동 교체)
      </div>
    </div>
  );
}

function ZoneLabel({ color, text, label }: { color: string; text: string; label: string }) {
  return (
    <div className={`mx-1 my-1 rounded-xl ${color} px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest ${text}`}>
      {label}
    </div>
  );
}

function Row({
  rank,
  nickname,
  exp,
  isMe,
  inPromotion,
  inDemotion,
}: {
  rank: number;
  nickname: string;
  exp: number;
  isMe: boolean;
  inPromotion: boolean;
  inDemotion: boolean;
}) {
  let bg = "surface";
  let ring = "";
  if (isMe) {
    bg = "bg-coral-500 text-white";
    ring = "ring-2 ring-coral-300";
  } else if (inPromotion) {
    bg = "bg-teal-50 dark:bg-teal-500/10 text-default";
  } else if (inDemotion) {
    bg = "bg-coral-50 dark:bg-coral-500/8 text-default";
  } else {
    bg = "surface text-default";
  }
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  return (
    <div className={`mx-1 my-0.5 rounded-2xl px-3 py-2.5 flex items-center gap-3 ${bg} ${ring}`}>
      <div className={`w-7 h-7 rounded-full grid place-items-center text-xs font-black tabular-nums ${
        isMe ? "bg-white/20 text-white" : "surface-subtle text-default"
      }`}>
        {medal ?? rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-extrabold truncate ${isMe ? "" : ""}`}>
          {nickname} {isMe && <span className="ml-1 text-[10px] opacity-80">(나)</span>}
        </div>
      </div>
      <div className={`text-sm font-black tabular-nums ${isMe ? "" : "text-default"}`}>
        {exp.toLocaleString()}
        <span className={`text-[10px] ml-0.5 ${isMe ? "opacity-80" : "text-muted"}`}>XP</span>
      </div>
    </div>
  );
}
