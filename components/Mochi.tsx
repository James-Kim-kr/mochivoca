"use client";

import { motion } from "framer-motion";

export type MochiMood = "idle" | "happy" | "sad" | "wave";

interface Props {
  mood?: MochiMood;
  size?: number;
}

export default function Mochi({ mood = "idle", size = 96 }: Props) {
  const blush = mood === "happy" || mood === "wave";

  const animateBody =
    mood === "happy"
      ? { y: [0, -6, 0], rotate: [-3, 3, -3] }
      : mood === "wave"
      ? { rotate: [-4, 4, -4] }
      : mood === "sad"
      ? { y: [0, 2, 0] }
      : { y: [0, -3, 0] };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="-60 -60 120 120"
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, ...animateBody }}
      transition={{
        scale: { type: "spring", stiffness: 260, damping: 14 },
        y: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: 0.9, repeat: Infinity, ease: "easeInOut" },
      }}
      aria-label="모찌 캐릭터"
    >
      <ellipse cx="0" cy="38" rx="38" ry="6" fill="#000" opacity="0.08" />
      <g>
        <path
          d="M -40 6 C -42 -28 -22 -44 0 -44 C 22 -44 42 -28 40 6 C 38 30 22 40 0 40 C -22 40 -42 30 -40 6 Z"
          fill="#FFF6E9"
          stroke="#F0D5B5"
          strokeWidth="2"
        />
        <ellipse cx="0" cy="-30" rx="22" ry="6" fill="#FFC8B5" opacity="0.55" />

        {/* eyes */}
        {mood === "happy" || mood === "wave" ? (
          <>
            <path d="M -14 -6 q 4 6 8 0" stroke="#2A241B" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 6 -6 q 4 6 8 0" stroke="#2A241B" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        ) : mood === "sad" ? (
          <>
            <path d="M -14 -4 q 4 -6 8 0" stroke="#2A241B" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 6 -4 q 4 -6 8 0" stroke="#2A241B" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="-10" cy="-4" r="3" fill="#2A241B" />
            <circle cx="10" cy="-4" r="3" fill="#2A241B" />
            <circle cx="-9" cy="-5" r="1" fill="#fff" />
            <circle cx="11" cy="-5" r="1" fill="#fff" />
          </>
        )}

        {/* mouth */}
        {mood === "happy" ? (
          <path d="M -6 8 q 6 8 12 0" stroke="#2A241B" strokeWidth="3" fill="#FF6B47" strokeLinecap="round" />
        ) : mood === "sad" ? (
          <path d="M -5 10 q 5 -6 10 0" stroke="#2A241B" strokeWidth="3" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M -4 8 q 4 4 8 0" stroke="#2A241B" strokeWidth="3" fill="none" strokeLinecap="round" />
        )}

        {/* blush */}
        {blush && (
          <>
            <ellipse cx="-18" cy="6" rx="5" ry="3" fill="#FF8463" opacity="0.7" />
            <ellipse cx="18" cy="6" rx="5" ry="3" fill="#FF8463" opacity="0.7" />
          </>
        )}

        {/* sweat for sad */}
        {mood === "sad" && (
          <path d="M 22 -10 q 4 6 0 10 q -4 -4 0 -10 Z" fill="#6FDCC0" />
        )}
      </g>
    </motion.svg>
  );
}
