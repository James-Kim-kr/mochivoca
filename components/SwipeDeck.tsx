"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import Flashcard, { Toggles } from "./Flashcard";
import type { Word } from "@/lib/words";

interface Props {
  word: Word;
  toggles: Toggles;
  autoSpeak?: boolean;
  onAnswer: (knew: boolean) => void;
}

export default function SwipeDeck({ word, toggles, autoSpeak, onAnswer }: Props) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -120, 0, 120, 200], [0.5, 1, 1, 1, 0.5]);
  const knowOpacity = useTransform(x, [0, 100], [0, 1]);
  const dontOpacity = useTransform(x, [-100, 0], [1, 0]);

  return (
    <div className="relative w-full" key={word.id}>
      <motion.div
        style={{ x, rotate, opacity }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.x > 120) {
            onAnswer(true);
          } else if (info.offset.x < -120) {
            onAnswer(false);
          }
        }}
      >
        <div className="relative">
          <Flashcard word={word} toggles={toggles} autoSpeak={autoSpeak} />
          <motion.div
            style={{ opacity: knowOpacity }}
            className="absolute top-6 right-6 rotate-12 border-4 border-mochi-mint text-mochi-mint font-black text-2xl px-3 py-1 rounded-xl bg-white/80"
          >
            알아요!
          </motion.div>
          <motion.div
            style={{ opacity: dontOpacity }}
            className="absolute top-6 left-6 -rotate-12 border-4 border-mochi-pink text-mochi-pink font-black text-2xl px-3 py-1 rounded-xl bg-white/80"
          >
            다시!
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
