"use client";

import { motion } from "framer-motion";
import { classifyPitch, getPitchPattern, splitMora } from "@/lib/pitch";

interface Props {
  kana: string;
  pattern?: number[];
  audioLevel?: number; // 0-1 live mic amplitude
  recording?: boolean;
  small?: boolean;
}

export default function PitchAccent({ kana, pattern, audioLevel = 0, recording = false, small }: Props) {
  const moras = splitMora(kana);
  const p = getPitchPattern(kana, pattern);
  const type = classifyPitch(p);
  const width = Math.max(160, moras.length * (small ? 28 : 36));
  const height = small ? 36 : 56;
  const padX = 16;
  const top = 8;
  const bottom = height - 14;

  const points = moras.map((_, i) => {
    const x = padX + (i * (width - padX * 2)) / Math.max(1, moras.length - 1);
    const y = p[i] === 1 ? top : bottom;
    return { x, y };
  });

  const pathD = points
    .map((pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = points[i - 1];
      const cx = (prev.x + pt.x) / 2;
      return `Q ${cx} ${prev.y} ${cx} ${(prev.y + pt.y) / 2} T ${pt.x} ${pt.y}`;
    })
    .join(" ");

  const typeLabel: Record<string, string> = {
    heiban: "헤이반 (平板)",
    atamadaka: "아타마다카 (頭高)",
    nakadaka: "나카다카 (中高)",
    odaka: "오다카 (尾高)",
    unknown: "—",
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={width} height={height} className="overflow-visible">
        {/* baseline grid */}
        <line x1={padX} x2={width - padX} y1={top} y2={top} stroke="currentColor" strokeOpacity={0.1} strokeDasharray="2 3" className="text-default" />
        <line x1={padX} x2={width - padX} y1={bottom} y2={bottom} stroke="currentColor" strokeOpacity={0.1} strokeDasharray="2 3" className="text-default" />
        {/* user audio wave (only shown when recording) */}
        {recording && (
          <motion.circle
            cx={width / 2}
            cy={(top + bottom) / 2}
            r={20 + audioLevel * 30}
            fill="currentColor"
            className="text-coral-500"
            opacity={0.15}
          />
        )}
        {/* native pitch curve */}
        <motion.path
          d={pathD}
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          className="text-coral-500"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
        {points.map((pt, i) => (
          <g key={i}>
            <circle cx={pt.x} cy={pt.y} r={small ? 4 : 5} fill="currentColor" className="text-coral-500" />
            <text
              x={pt.x}
              y={height - 1}
              textAnchor="middle"
              className="fill-current text-default font-jp"
              style={{ fontSize: small ? 10 : 12, fontWeight: 700 }}
            >
              {moras[i]}
            </text>
          </g>
        ))}
      </svg>
      {!small && (
        <div className="text-[10px] font-bold text-muted">
          억양 패턴 · <span className="text-coral-500">{typeLabel[type]}</span>
        </div>
      )}
    </div>
  );
}
