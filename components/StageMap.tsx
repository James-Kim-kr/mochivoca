"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { getStageCount } from "@/lib/words";
import type { JlptLevel } from "@/lib/words";

export default function StageMap({ level }: { level: JlptLevel }) {
  const isStageUnlocked = useAppStore((s) => s.isStageUnlocked);
  const isStageCompleted = useAppStore((s) => s.isStageCompleted);
  const total = getStageCount(level);
  const days = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <div className="rounded-3xl bg-white/70 p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-extrabold text-mochi-brown">{level} 학습 길</div>
        <div className="text-xs text-mochi-brown/50">
          {days.filter((d) => isStageCompleted(level, d)).length} / {total} 완료
        </div>
      </div>
      <div className="flex flex-col items-center gap-2">
        {days.map((day, i) => {
          const unlocked = isStageUnlocked(level, day);
          const completed = isStageCompleted(level, day);
          const next = unlocked && !completed;
          const offset = i % 2 === 0 ? "translate-x-6" : "-translate-x-6";
          const inner = (
            <motion.div
              whileHover={unlocked ? { scale: 1.05 } : {}}
              whileTap={unlocked ? { scale: 0.95 } : {}}
              className={`w-16 h-16 rounded-full grid place-items-center font-black text-sm transition-all ${offset} ${
                completed
                  ? "bg-mochi-mint text-mochi-brown shadow-pop"
                  : next
                  ? "bg-mochi-pink text-white shadow-pop animate-bounceSoft"
                  : unlocked
                  ? "bg-white text-mochi-brown border-2 border-mochi-peach"
                  : "bg-mochi-cream text-mochi-brown/30 border-2 border-dashed border-mochi-brown/15"
              }`}
            >
              {completed ? "⭐" : !unlocked ? "🔒" : `Day ${day}`}
            </motion.div>
          );
          if (!unlocked) {
            return (
              <div key={day} className="cursor-not-allowed">
                {inner}
              </div>
            );
          }
          return (
            <Link key={day} href={`/study?day=${day}`} className="block">
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
