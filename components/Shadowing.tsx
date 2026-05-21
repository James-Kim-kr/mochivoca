"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import PitchAccent from "./PitchAccent";
import { createMicLevelStream, getSpeechRecognition, kanaSimilarity, shadowingAvailable } from "@/lib/shadowing";
import { speak } from "@/lib/tts";

interface Props {
  kana: string;
  pattern?: number[];
  display: string;
  onClose?: () => void;
}

type Phase = "idle" | "listening" | "scored";

export default function Shadowing({ kana, pattern, display, onClose }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const micRef = useRef<ReturnType<typeof createMicLevelStream> | null>(null);
  const recogRef = useRef<ReturnType<typeof getSpeechRecognition>>(null);
  const animRef = useRef<number | null>(null);

  const supported = shadowingAvailable();

  useEffect(() => {
    return () => {
      micRef.current?.stop();
      try { recogRef.current?.stop(); } catch {}
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const startListening = async () => {
    setErr(null);
    setTranscript("");
    setScore(0);
    if (!supported) {
      setErr("이 브라우저에서는 음성 인식을 지원하지 않아요 (Chrome 권장)");
      return;
    }
    setPhase("listening");

    try {
      const mic = createMicLevelStream();
      await mic.start();
      micRef.current = mic;
      const tick = () => {
        setLevel(mic.get());
        animRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      setErr("마이크 권한이 필요해요");
      setPhase("idle");
      return;
    }

    const recog = getSpeechRecognition();
    if (!recog) {
      setErr("음성 인식을 사용할 수 없어요");
      stop();
      return;
    }
    recog.lang = "ja-JP";
    recog.continuous = false;
    recog.interimResults = false;
    recog.onresult = (ev) => {
      const text = ev.results[0]?.[0]?.transcript ?? "";
      setTranscript(text);
      const sim = kanaSimilarity(kana, text);
      setScore(Math.round(sim * 100));
      setPhase("scored");
      micRef.current?.stop();
      micRef.current = null;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
    recog.onerror = (ev) => {
      setErr(ev.error === "no-speech" ? "소리가 잘 안 들렸어요. 다시 해볼까요?" : `오류: ${ev.error ?? "unknown"}`);
      stop();
    };
    recog.onend = () => {
      if (phase === "listening") {
        // Recognition ended without result
        stop();
      }
    };
    try {
      recog.start();
      recogRef.current = recog;
    } catch {
      setErr("음성 인식을 시작할 수 없어요");
      stop();
    }
  };

  const stop = () => {
    setPhase("idle");
    micRef.current?.stop();
    micRef.current = null;
    try { recogRef.current?.stop(); } catch {}
    recogRef.current = null;
    if (animRef.current) cancelAnimationFrame(animRef.current);
  };

  const playRef = () => speak(kana, "ja-JP", { rate: 0.85 });

  return (
    <div className="rounded-3xl surface border border-subtle p-5 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-coral-500">쉐도잉 연습</div>
          <div className="font-display text-2xl font-black text-strong">{display}</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="w-9 h-9 rounded-full surface-subtle text-default grid place-items-center press-down">
            ✕
          </button>
        )}
      </div>

      <div className="surface-subtle rounded-2xl p-3 mb-3 flex justify-center">
        <PitchAccent kana={kana} pattern={pattern} audioLevel={level} recording={phase === "listening"} />
      </div>

      {phase === "scored" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-3 mb-3 text-center ${
            score >= 70 ? "bg-teal-100 dark:bg-teal-500/15" : "bg-coral-100 dark:bg-coral-500/15"
          }`}
        >
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted">정확도</div>
          <div className={`text-2xl font-black tabular-nums ${score >= 70 ? "text-teal-600 dark:text-teal-300" : "text-coral-600 dark:text-coral-300"}`}>
            {score}%
          </div>
          <div className="text-[11px] text-muted mt-1">
            인식된 발화: <span className="font-jp font-bold">{transcript || "—"}</span>
          </div>
          <div className="text-[10px] text-muted mt-1">정답: <span className="font-jp">{kana}</span></div>
        </motion.div>
      )}

      {err && (
        <div className="rounded-2xl bg-coral-50 dark:bg-coral-500/15 border border-coral-200 dark:border-coral-500/30 px-3 py-2 mb-3 text-xs text-coral-600 dark:text-coral-300 text-center">
          {err}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button onClick={playRef} className="btn-clay surface text-default border-2 border-subtle text-sm">
          🔊 원어민 듣기
        </button>
        {phase === "listening" ? (
          <button onClick={stop} className="btn-clay bg-coral-500 text-white text-sm">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-white animate-pulse mr-1" />
            녹음 중... 중지
          </button>
        ) : (
          <button onClick={startListening} className="btn-clay bg-coral-500 text-white text-sm">
            🎤 따라 말하기
          </button>
        )}
      </div>

      {!supported && (
        <div className="text-[10px] text-faint text-center mt-3">
          ※ Chrome / Edge에서 가장 잘 동작해요
        </div>
      )}
    </div>
  );
}
