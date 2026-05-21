"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import Mochi from "@/components/Mochi";
import { useStoreReady } from "@/components/SessionGate";

export default function DonePage() {
  const [hydrated, setHydrated] = useState(false);
  const ready = useStoreReady();
  const streak = useAppStore((s) => s.streak);
  const todayCount = useAppStore((s) => s.todayCount());
  const totalXp = useAppStore((s) => s.totalXp);
  const show = hydrated && ready;

  useEffect(() => setHydrated(true), []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center relative overflow-hidden">
      {/* Confetti dots */}
      {[...Array(14)].map((_, i) => (
        <motion.span
          key={i}
          className={`absolute w-2 h-2 rounded-sm ${
            ["bg-coral-400","bg-teal-400","bg-butter-300","bg-coral-300","bg-teal-200"][i % 5]
          }`}
          style={{ left: `${(i * 7) % 95}%`, top: "-10%" }}
          animate={{ y: ["0vh", "110vh"], rotate: [0, 720], opacity: [0, 1, 0] }}
          transition={{ duration: 3 + (i % 4), repeat: Infinity, delay: i * 0.2 }}
        />
      ))}

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
      >
        <Mochi mood="happy" size={160} />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-3xl font-black text-strong"
      >
        오늘 학습 끝!
      </motion.h1>
      <p className="text-muted -mt-3 text-sm">정말 잘했어요 🎉</p>

      <div className="grid grid-cols-3 gap-3 w-full mt-2">
        <Stat label="연속" value={show ? `${streak}` : "-"} unit="일" emoji="🔥" />
        <Stat label="오늘 완벽" value={show ? `${todayCount}` : "-"} unit="개" emoji="✨" />
        <Stat label="총 EXP" value={show ? `${totalXp}` : "-"} unit="" emoji="⭐" />
      </div>

      <div className="w-full flex flex-col gap-2 mt-4">
        <Link href="/" className="btn-clay bg-coral-500 text-white">
          홈으로 돌아가기
        </Link>
        <Link href="/study" className="btn-clay surface text-default border-2 border-subtle">
          한 번 더 학습하기
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, unit, emoji }: { label: string; value: string; unit: string; emoji: string }) {
  return (
    <div className="rounded-3xl surface border border-subtle shadow-card py-3 px-2">
      <div className="text-lg">{emoji}</div>
      <div className="font-black text-strong mt-1 tabular-nums">
        <span className="text-xl">{value}</span>
        {unit && <span className="text-xs text-muted ml-0.5">{unit}</span>}
      </div>
      <div className="text-[10px] text-muted font-bold mt-0.5">{label}</div>
    </div>
  );
}
