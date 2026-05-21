"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";
import Mochi from "@/components/Mochi";
import { speak } from "@/lib/tts";

export default function ScrapPage() {
  const [hydrated, setHydrated] = useState(false);
  const scraps = useAppStore((s) => s.scraps);
  const deleteScrap = useAppStore((s) => s.deleteScrap);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => setHydrated(true), []);
  if (!hydrated) return <div className="flex-1 grid place-items-center"><Mochi size={120} /></div>;

  const open = scraps.find((s) => s.id === openId);

  return (
    <div className="flex-1 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold text-coral-500 uppercase tracking-widest">My Scrap</div>
          <h1 className="text-2xl font-black text-strong">나만의 모찌 단어장</h1>
        </div>
        <Link
          href="/scrap/new"
          className="btn-clay bg-coral-500 text-white px-4 py-2 text-sm"
        >
          + 새로 만들기
        </Link>
      </div>

      {scraps.length === 0 ? (
        <div className="flex-1 grid place-items-center text-center">
          <div className="rounded-4xl surface border border-subtle p-8 shadow-card max-w-sm">
            <Mochi mood="wave" size={100} />
            <div className="font-extrabold text-strong mt-3">첫 스크랩을 만들어보세요</div>
            <p className="text-xs text-muted mt-1">
              메뉴판, 간판, 드라마 캡처 등을 올리면<br/>AI 모찌가 단어를 뽑아 단어장으로 만들어줘요
            </p>
            <Link href="/scrap/new" className="btn-clay mt-4 bg-coral-500 text-white text-sm w-full inline-flex">
              📸 시작하기
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {scraps.map((sc) => (
            <button
              key={sc.id}
              onClick={() => setOpenId(sc.id)}
              className="rounded-3xl surface border border-subtle shadow-card overflow-hidden press-down text-left"
            >
              {sc.imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sc.imageDataUrl} alt="" className="w-full aspect-square object-cover" />
              ) : (
                <div className="w-full aspect-square bg-aurora grid place-items-center">
                  <span className="text-4xl">📸</span>
                </div>
              )}
              <div className="p-2.5">
                <div className="text-xs font-extrabold text-strong truncate">{sc.title}</div>
                <div className="text-[10px] text-muted mt-0.5">
                  {sc.items.length}개 단어 · {new Date(sc.createdAt).toLocaleDateString("ko-KR")}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpenId(null)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm grid place-items-end sm:place-items-center px-3 pb-20"
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md surface rounded-4xl border border-subtle shadow-card p-5 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[10px] font-bold text-coral-500 uppercase tracking-widest">스크랩 단어장</div>
                  <div className="font-extrabold text-strong">{open.title}</div>
                </div>
                <button
                  onClick={() => setOpenId(null)}
                  className="w-9 h-9 rounded-full surface-subtle text-default grid place-items-center press-down"
                >
                  ✕
                </button>
              </div>
              {open.imageDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={open.imageDataUrl} alt="" className="w-full rounded-2xl mb-3 max-h-48 object-cover" />
              )}
              <div className="flex flex-col gap-2">
                {open.items.map((it) => (
                  <div key={it.id} className="rounded-2xl surface-subtle p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-display text-xl font-black text-strong">{it.word}</div>
                        <div className="font-jp text-xs text-muted">{it.reading}</div>
                      </div>
                      <button
                        onClick={() => speak(it.reading, "ja-JP", { rate: 0.85 })}
                        className="w-8 h-8 rounded-full surface grid place-items-center press-down"
                        aria-label="발음 듣기"
                      >
                        🔊
                      </button>
                    </div>
                    <div className="text-sm font-bold text-default mt-1">{it.meaning}</div>
                    {it.context_snippet && (
                      <div className="text-[10px] text-faint mt-1 italic">📍 {it.context_snippet}</div>
                    )}
                    {it.example_ja && (
                      <div className="mt-2 rounded-xl surface p-2">
                        <div className="font-jp text-xs text-strong">{it.example_ja}</div>
                        {it.example_ko && <div className="text-[10px] text-muted mt-0.5">{it.example_ko}</div>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  if (confirm("이 스크랩을 삭제할까요?")) {
                    deleteScrap(open.id);
                    setOpenId(null);
                  }
                }}
                className="w-full mt-4 rounded-2xl py-2.5 surface text-coral-500 font-bold press-down border border-coral-200 dark:border-coral-500/30 text-sm"
              >
                삭제
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
