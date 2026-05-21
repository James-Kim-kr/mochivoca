"use client";

import { useEffect, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useAppStore } from "@/lib/store";
import { useTheme } from "@/components/ThemeProvider";
import Mochi from "@/components/Mochi";
import { useStoreReady } from "@/components/SessionGate";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [hydrated, setHydrated] = useState(false);

  const level = useAppStore((s) => s.level);
  const setLevel = useAppStore((s) => s.setLevel);
  const autoSpeak = useAppStore((s) => s.autoSpeak);
  const setAutoSpeak = useAppStore((s) => s.setAutoSpeak);
  const handsFree = useAppStore((s) => s.handsFree);
  const setHandsFree = useAppStore((s) => s.setHandsFree);
  const resetAll = useAppStore((s) => s.resetAll);

  const ready = useStoreReady();

  useEffect(() => setHydrated(true), []);

  if (!hydrated || !ready) {
    return <div className="flex-1 grid place-items-center"><Mochi size={120} /></div>;
  }

  return (
    <div className="flex-1 flex flex-col gap-4">
      <h1 className="text-2xl font-black text-strong">설정</h1>

      {/* Account */}
      <Section title="계정">
        <div className="flex items-center gap-3 p-3">
          {session?.user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-coral-200 grid place-items-center text-coral-700 font-black">
              {(session?.user?.name ?? "?").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-extrabold text-strong truncate">
              {session?.user?.name ?? "사용자"}
            </div>
            <div className="text-[11px] text-faint truncate">{session?.user?.email}</div>
          </div>
        </div>
      </Section>

      {/* Theme */}
      <Section title="테마">
        <div className="grid grid-cols-3 gap-2">
          <ThemeOption active={theme === "system"} onClick={() => setTheme("system")} label="시스템" emoji="🌓" />
          <ThemeOption active={theme === "light"} onClick={() => setTheme("light")} label="라이트" emoji="☀️" />
          <ThemeOption active={theme === "dark"} onClick={() => setTheme("dark")} label="다크" emoji="🌙" />
        </div>
      </Section>

      {/* Study preferences */}
      <Section title="학습 환경">
        <Toggle
          label="자동 발음 재생"
          desc="카드가 나올 때 일본어 발음을 자동으로 들려줘요"
          checked={autoSpeak}
          onChange={setAutoSpeak}
        />
        <div className="divider-dotted my-1" />
        <Toggle
          label="핸즈프리 모드 기본 ON"
          desc="이동 중 손을 쓰지 않고도 자동으로 학습이 진행돼요"
          checked={handsFree}
          onChange={setHandsFree}
        />
      </Section>

      {/* Level */}
      <Section title="JLPT 코스">
        <div className="grid grid-cols-5 gap-2 p-1">
          {(["N5", "N4", "N3", "N2", "N1"] as const).map((lv) => {
            const ready = lv === "N5";
            const active = level === lv;
            return (
              <button
                key={lv}
                disabled={!ready}
                onClick={() => ready && setLevel(lv)}
                className={`py-2.5 rounded-2xl font-black text-sm transition-all press-down ${
                  active
                    ? "bg-coral-500 text-white shadow-clay"
                    : ready
                    ? "surface text-default border border-subtle"
                    : "surface-subtle text-faint border border-dashed border-subtle"
                }`}
              >
                {lv}
                {!ready && <div className="text-[9px] font-bold">준비중</div>}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Danger zone */}
      <Section title="기타">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full surface rounded-2xl py-3 text-default font-bold press-down border border-subtle"
        >
          로그아웃
        </button>
        <button
          onClick={() => {
            if (confirm("모든 학습 기록을 초기화할까요? 되돌릴 수 없어요.")) resetAll();
          }}
          className="w-full mt-2 surface rounded-2xl py-3 text-coral-500 font-bold press-down border border-coral-200 dark:border-coral-500/30"
        >
          학습 기록 초기화
        </button>
      </Section>

      <div className="text-center text-[11px] text-faint pt-4 pb-2">
        모찌보카 v1.1 · 🍡 Made with love
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-4xl surface border border-subtle p-4 shadow-card">
      <div className="text-[11px] font-extrabold text-coral-500 uppercase tracking-widest mb-2 px-1">
        {title}
      </div>
      {children}
    </section>
  );
}

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-2">
      <div className="flex-1">
        <div className="text-sm font-extrabold text-strong">{label}</div>
        {desc && <div className="text-[11px] text-muted mt-0.5">{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-7 rounded-full transition-colors ${
          checked ? "bg-coral-500" : "surface-subtle"
        }`}
        aria-pressed={checked}
      >
        <span
          className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-card transition-all ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function ThemeOption({
  active,
  onClick,
  label,
  emoji,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  emoji: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-3 rounded-2xl press-down border ${
        active
          ? "bg-coral-500 text-white border-coral-500 shadow-clay"
          : "surface text-default border-subtle"
      }`}
    >
      <span className="text-xl">{emoji}</span>
      <span className="text-[11px] font-bold">{label}</span>
    </button>
  );
}
