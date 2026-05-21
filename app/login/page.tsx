"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Mochi from "@/components/Mochi";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex-1 grid place-items-center"><Mochi size={120} /></div>}>
      <LoginPage />
    </Suspense>
  );
}

function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const errorParam = params.get("error");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace(callbackUrl);
  }, [status, router, callbackUrl]);

  const handleSignIn = async () => {
    setBusy(true);
    await signIn("google", { callbackUrl });
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-aurora blur-2xl" />
          <Mochi mood="wave" size={140} />
        </motion.div>

        <div className="text-[11px] font-bold text-coral-500 uppercase tracking-[0.2em]">
          MochiVoca · 모찌보카
        </div>
        <h1 className="text-3xl font-black text-strong leading-tight">
          하루 10분,<br />귀여운 일본어 단어
        </h1>
        <p className="text-sm text-muted max-w-xs">
          뇌과학 기반 플래시카드 + 게임처럼 즐거운 학습
        </p>

        {/* Benefit chips */}
        <div className="grid grid-cols-3 gap-2 w-full mt-4">
          <BenefitChip emoji="🔊" title="원어민" sub="발음 자동" />
          <BenefitChip emoji="📅" title="매일" sub="10~15분" />
          <BenefitChip emoji="🎧" title="핸즈프리" sub="이동 중" />
        </div>

        {errorParam && (
          <div className="text-xs font-bold text-coral-600 bg-coral-50 border border-coral-200 px-3 py-2 rounded-2xl mt-3">
            로그인 중 문제가 생겼어요 ({errorParam})
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 pb-2">
        <button
          onClick={handleSignIn}
          disabled={busy || status === "loading"}
          className="btn-clay w-full surface text-default border-2 border-subtle"
        >
          <GoogleIcon />
          <span>{busy ? "이동 중..." : "Google로 계속하기"}</span>
        </button>

        <p className="text-[10.5px] text-faint text-center px-4">
          로그인하면 모찌보카의 서비스 약관과 개인정보 처리방침에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  );
}

function BenefitChip({ emoji, title, sub }: { emoji: string; title: string; sub: string }) {
  return (
    <div className="rounded-2xl surface border border-subtle p-2.5 shadow-card">
      <div className="text-lg">{emoji}</div>
      <div className="text-[11px] font-extrabold text-strong mt-1">{title}</div>
      <div className="text-[9.5px] text-muted">{sub}</div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.6 8.4 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.3 0 10.1-2 13.7-5.3l-6.3-5.2C29.3 35 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.6 5C9.5 39.5 16.1 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4 5.6l6.3 5.2C40 35 44 30 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}
