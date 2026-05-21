"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import Mochi from "@/components/Mochi";
import type { JlptLevel } from "@/lib/words";

const LEVELS: { level: JlptLevel; desc: string; ready: boolean }[] = [
  { level: "N5", desc: "처음 시작해요", ready: true },
  { level: "N4", desc: "기초는 떼었어요", ready: false },
  { level: "N3", desc: "일상회화 도전", ready: false },
  { level: "N2", desc: "중상급 어휘", ready: false },
  { level: "N1", desc: "최고 레벨", ready: false },
];

export default function OnboardingPage() {
  const router = useRouter();
  const setLevel = useAppStore((s) => s.setLevel);
  const [selected, setSelected] = useState<JlptLevel | null>(null);

  const start = () => {
    if (!selected) return;
    setLevel(selected);
    router.push("/");
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex flex-col items-center text-center gap-2 mt-2">
        <div className="relative">
          <div className="absolute inset-0 bg-aurora blur-2xl" />
          <Mochi mood="wave" size={120} />
        </div>
        <div className="text-[11px] font-bold text-coral-500 uppercase tracking-[0.2em] mt-1">
          시작하기 · MochiVoca
        </div>
        <h1 className="text-2xl font-black text-strong">목표 레벨을 골라주세요</h1>
        <p className="text-sm text-muted">
          나중에 설정에서 언제든 바꿀 수 있어요
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-2">
        {LEVELS.map((lv) => {
          const active = selected === lv.level;
          return (
            <motion.button
              key={lv.level}
              whileTap={{ scale: 0.98 }}
              onClick={() => lv.ready && setSelected(lv.level)}
              disabled={!lv.ready}
              className={`flex items-center justify-between rounded-3xl px-4 py-3 border-2 transition-all press-down ${
                active
                  ? "bg-coral-500 text-white border-coral-500 shadow-clay"
                  : lv.ready
                  ? "surface text-default border-subtle"
                  : "surface-subtle text-faint border-dashed border-subtle"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl grid place-items-center font-black ${
                    active
                      ? "bg-white/20 text-white"
                      : lv.ready
                      ? "bg-coral-500 text-white"
                      : "bg-ink-200 dark:bg-ink-700 text-faint"
                  }`}
                >
                  {lv.level}
                </div>
                <div className="text-left">
                  <div className="font-extrabold">JLPT {lv.level}</div>
                  <div className={`text-[11px] ${active ? "opacity-90" : "text-muted"}`}>
                    {lv.desc}
                  </div>
                </div>
              </div>
              {!lv.ready && (
                <span className="text-[10px] font-bold bg-ink-200 dark:bg-ink-700 text-faint px-2 py-1 rounded-full">
                  곧 출시
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      <button
        onClick={start}
        disabled={!selected}
        className={`btn-clay mt-auto ${
          selected
            ? "bg-coral-500 text-white"
            : "surface-subtle text-faint cursor-not-allowed"
        }`}
      >
        시작하기 →
      </button>
    </div>
  );
}
