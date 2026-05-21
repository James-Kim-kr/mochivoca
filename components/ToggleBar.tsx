"use client";

import type { Toggles } from "./Flashcard";

interface Props {
  toggles: Toggles;
  onChange: (next: Toggles) => void;
}

const items: { key: keyof Toggles; label: string; jp: string }[] = [
  { key: "kanji", label: "한자", jp: "漢" },
  { key: "kana", label: "히라가나", jp: "あ" },
  { key: "meaning", label: "뜻", jp: "意" },
];

export default function ToggleBar({ toggles, onChange }: Props) {
  return (
    <div className="surface-subtle rounded-2xl p-1 flex w-full">
      {items.map((it) => {
        const on = toggles[it.key];
        return (
          <button
            key={it.key}
            onClick={() => onChange({ ...toggles, [it.key]: !on })}
            className={`flex-1 rounded-xl px-2 py-2 transition-all active:scale-95 ${
              on
                ? "surface text-default shadow-card"
                : "text-faint"
            }`}
            aria-pressed={on}
          >
            <div className="flex items-center justify-center gap-1.5">
              <span className={`font-jp text-base ${on ? "" : "opacity-50"}`}>{it.jp}</span>
              <span className="text-[11px] font-bold">{it.label}</span>
            </div>
            <div className={`text-[9px] mt-0.5 ${on ? "text-coral-500" : "text-faint"}`}>
              {on ? "● 보임" : "○ 가림"}
            </div>
          </button>
        );
      })}
    </div>
  );
}
