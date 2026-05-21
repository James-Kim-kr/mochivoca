"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { getStageWords } from "@/lib/words";
import RoleplayChat from "@/components/RoleplayChat";
import RedPenWriting from "@/components/RedPenWriting";
import Mochi from "@/components/Mochi";

type Phase = "intro" | "roleplay" | "writing" | "done";

export default function ChallengePage() {
  const router = useRouter();
  const params = useParams<{ day: string }>();
  const day = parseInt(params.day, 10);

  const level = useAppStore((s) => s.level);
  const isChallengeUnlocked = useAppStore((s) => s.isChallengeUnlocked);
  const markChallengeComplete = useAppStore((s) => s.markChallengeComplete);
  const [phase, setPhase] = useState<Phase>("intro");
  const [hydrated, setHydrated] = useState(false);
  const [rpSuccess, setRpSuccess] = useState(false);

  useEffect(() => setHydrated(true), []);

  const words = useMemo(() => (level ? getStageWords(level, day) : []), [level, day]);
  const rpWord = useMemo(() => words.find((w) => w.roleplay_context) ?? null, [words]);
  const writingWord = useMemo(() => words.find((w) => w.id !== rpWord?.id) ?? words[0], [words, rpWord]);

  useEffect(() => {
    if (!hydrated || !level) return;
    if (!isChallengeUnlocked(level, day)) {
      router.replace("/");
    }
  }, [hydrated, level, day, isChallengeUnlocked, router]);

  if (!hydrated || !level) {
    return <div className="flex-1 grid place-items-center"><Mochi size={120} /></div>;
  }

  if (!rpWord) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
        <Mochi mood="sad" size={120} />
        <div className="text-strong font-extrabold">Day {day}에는 아직 챌린지가 없어요</div>
        <button onClick={() => router.push("/")} className="btn-clay surface text-default border-2 border-subtle">
          돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="w-10 h-10 rounded-full surface border border-subtle text-default grid place-items-center press-down shadow-card"
        >
          ←
        </button>
        <div className="flex-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-coral-500">실전 회화 챌린지</div>
          <h1 className="text-lg font-black text-strong">Day {day} · {level}</h1>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === "intro" && (
          <motion.div key="intro" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col gap-4">
            <div className="rounded-4xl bg-aurora border border-subtle p-5">
              <div className="flex items-start gap-4">
                <Mochi mood="wave" size={84} />
                <div className="flex-1">
                  <div className="text-[11px] font-bold text-coral-500">시나리오</div>
                  <div className="text-base font-extrabold text-strong mt-0.5">
                    {rpWord.roleplay_context?.situation}
                  </div>
                  <div className="text-[11px] text-muted mt-1">
                    상대: {rpWord.roleplay_context?.ai_role}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl surface border border-subtle p-4 shadow-card">
              <div className="text-[10px] font-bold uppercase tracking-widest text-coral-500 mb-2">규칙</div>
              <ul className="text-sm text-default space-y-1.5">
                <li>· 최대 <b>4턴</b> 안에 대화를 마무리해요</li>
                <li>· 화면에 표시되는 <b>미션 키워드</b>를 모두 활용해서 답하면 챌린지 성공</li>
                <li>· 그 다음 단어 한 개로 자유 <b>작문 + AI 첨삭</b>이 이어져요</li>
              </ul>
            </div>

            <button onClick={() => setPhase("roleplay")} className="btn-clay mt-auto bg-coral-500 text-white text-lg">
              🚀 챌린지 시작하기
            </button>
          </motion.div>
        )}

        {phase === "roleplay" && rpWord.roleplay_context && (
          <motion.div key="rp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
            <RoleplayChat
              scenario={rpWord.roleplay_context}
              onComplete={(success) => {
                setRpSuccess(success);
                setPhase("writing");
              }}
            />
          </motion.div>
        )}

        {phase === "writing" && writingWord && (
          <motion.div key="wr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
            <RedPenWriting
              word={writingWord}
              onComplete={(success) => {
                if (rpSuccess && success && level) markChallengeComplete(level, day);
                else if ((rpSuccess || success) && level) markChallengeComplete(level, day);
                setPhase("done");
              }}
            />
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
            <Mochi mood="happy" size={140} />
            <h2 className="text-2xl font-black text-strong">챌린지 완료!</h2>
            <p className="text-sm text-muted">+50 EXP 적립 🎉</p>
            <button onClick={() => router.push("/")} className="btn-clay bg-coral-500 text-white w-full">
              홈으로
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
