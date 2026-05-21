"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { speak } from "@/lib/tts";
import Mochi from "./Mochi";
import type { RoleplayContext } from "@/lib/words";

interface Props {
  scenario: RoleplayContext;
  onComplete: (success: boolean) => void;
}

type Msg = { role: "user" | "assistant"; content: string };

export default function RoleplayChat({ scenario, onComplete }: Props) {
  const missions = scenario.mission_keywords ?? [];
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", content: scenario.initial_msg }]);
  const [input, setInput] = useState("");
  const [usedKeywords, setUsedKeywords] = useState<string[]>([]);
  const [turn, setTurn] = useState(1);
  const [busy, setBusy] = useState(false);
  const [ended, setEnded] = useState(false);
  const [success, setSuccess] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    speak(scenario.initial_msg, "ja-JP", { rate: 0.9 });
  }, [scenario.initial_msg]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, busy]);

  const send = async () => {
    const text = input.trim();
    if (!text || busy || ended) return;
    setBusy(true);
    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages);
    setInput("");

    try {
      const res = await fetch("/api/llm/roleplay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scenario: {
            situation: scenario.situation,
            ai_role: scenario.ai_role,
            initial_msg: scenario.initial_msg,
          },
          mission_keywords: missions,
          history: messages,
          user_input: text,
          turn,
        }),
      });
      const data: {
        assistant: string;
        used_keywords: string[];
        mission_complete: boolean;
        ended: boolean;
      } = await res.json();
      setMessages([...nextMessages, { role: "assistant", content: data.assistant }]);
      setUsedKeywords(data.used_keywords);
      speak(data.assistant, "ja-JP", { rate: 0.9 });
      if (data.ended) {
        setEnded(true);
        setSuccess(data.mission_complete);
        setTimeout(() => onComplete(data.mission_complete), 1800);
      } else {
        setTurn((t) => t + 1);
      }
    } catch {
      setMessages([
        ...nextMessages,
        { role: "assistant", content: "(서버 연결 실패. 다시 시도해 주세요)" },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 gap-3">
      {/* Mission chips */}
      <div className="rounded-3xl surface border border-subtle p-3 shadow-card">
        <div className="text-[10px] font-bold uppercase tracking-widest text-coral-500 mb-2">
          미션 키워드 · {usedKeywords.length}/{missions.length}
        </div>
        <div className="flex flex-wrap gap-2">
          {missions.map((k) => {
            const done = usedKeywords.includes(k);
            return (
              <div
                key={k}
                className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all ${
                  done
                    ? "bg-teal-400 text-ink-700"
                    : "surface-subtle text-muted"
                }`}
              >
                {done ? "✓ " : ""}
                <span className="font-jp">{k}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-3xl surface-subtle border border-subtle p-3 flex flex-col gap-3 min-h-[260px]"
      >
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-end gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {m.role === "assistant" && (
                <div className="shrink-0">
                  <Mochi size={36} />
                </div>
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2 ${
                  m.role === "user"
                    ? "bg-coral-500 text-white rounded-br-md"
                    : "surface text-default rounded-bl-md border border-subtle"
                }`}
              >
                <div className={m.role === "assistant" ? "font-jp text-sm" : "text-sm"}>
                  {m.content}
                </div>
              </div>
            </motion.div>
          ))}
          {busy && (
            <motion.div
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <Mochi size={36} />
              <div className="surface border border-subtle rounded-2xl rounded-bl-md px-3 py-2">
                <span className="inline-flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-coral-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-coral-500 animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-coral-500 animate-bounce" style={{ animationDelay: "0.3s" }} />
                </span>
              </div>
            </motion.div>
          )}
          {ended && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`mx-auto rounded-2xl px-4 py-2 text-xs font-extrabold ${
                success
                  ? "bg-teal-400 text-ink-700"
                  : "bg-coral-100 dark:bg-coral-500/15 text-coral-600 dark:text-coral-300"
              }`}
            >
              {success ? "🎉 미션 성공! 단어를 모두 활용했어요" : "수고했어요! 다음엔 미션 단어를 모두 써볼까요?"}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={ended || busy}
          placeholder={ended ? "대화가 종료되었어요" : "일본어로 답해보세요..."}
          className="flex-1 surface border border-subtle rounded-2xl px-4 py-3 text-sm font-jp outline-none focus:border-coral-400 disabled:opacity-50"
        />
        <button
          onClick={send}
          disabled={!input.trim() || ended || busy}
          className="btn-clay bg-coral-500 text-white px-5 disabled:opacity-50"
        >
          전송
        </button>
      </div>
      <div className="text-[10px] text-faint text-center">
        턴 {turn}/4 · 미션 단어를 모두 포함해서 4턴 안에 대화를 끝내요
      </div>
    </div>
  );
}
