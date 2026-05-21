"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAppStore, Scrap, ScrapItem } from "@/lib/store";
import Mochi from "@/components/Mochi";
import type { ScrapExtractResponse } from "@/app/api/llm/scrap/route";

const HINTS = [
  { key: "menu", label: "메뉴판", emoji: "🍜" },
  { key: "sign", label: "간판", emoji: "🪧" },
  { key: "subway", label: "지하철", emoji: "🚇" },
  { key: "cafe", label: "카페", emoji: "☕" },
];

export default function ScrapNewPage() {
  const router = useRouter();
  const addScrap = useAppStore((s) => s.addScrap);
  const [hint, setHint] = useState<string>("menu");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [extracted, setExtracted] = useState<ScrapExtractResponse | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onPick = () => fileRef.current?.click();

  const onFile = (f: File) => {
    setFileName(f.name);
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(f);
  };

  const extract = async () => {
    setBusy(true);
    setExtracted(null);
    try {
      const res = await fetch("/api/llm/scrap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hint, filename: fileName }),
      });
      const data: ScrapExtractResponse = await res.json();
      setExtracted(data);
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!extracted) return;
    const items: ScrapItem[] = extracted.items.map((it, i) => ({
      id: `${Date.now()}_${i}`,
      ...it,
    }));
    const scrap: Scrap = {
      id: `scr_${Date.now()}`,
      createdAt: Date.now(),
      title: extracted.title,
      imageDataUrl: imageDataUrl ?? undefined,
      items,
    };
    addScrap(scrap);
    router.push("/scrap");
  };

  return (
    <div className="flex-1 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full surface border border-subtle text-default grid place-items-center press-down shadow-card"
        >
          ←
        </button>
        <div>
          <div className="text-[11px] font-bold text-coral-500 uppercase tracking-widest">새 스크랩</div>
          <h1 className="text-lg font-black text-strong">사진에서 단어 추출하기</h1>
        </div>
      </div>

      {/* Image picker */}
      <div className="rounded-3xl surface border border-subtle shadow-card p-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
        {imageDataUrl ? (
          <button onClick={onPick} className="block w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageDataUrl} alt="" className="w-full aspect-video object-cover rounded-2xl" />
            <div className="text-[11px] text-muted mt-2 text-center">탭해서 다른 사진 선택</div>
          </button>
        ) : (
          <button
            onClick={onPick}
            className="w-full aspect-video rounded-2xl border-2 border-dashed border-subtle grid place-items-center text-muted surface-subtle press-down"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-4xl">📸</span>
              <span className="text-sm font-bold">사진을 골라주세요</span>
              <span className="text-[10px]">카메라 또는 갤러리</span>
            </div>
          </button>
        )}
      </div>

      {/* Context hint */}
      <div className="rounded-3xl surface border border-subtle shadow-card p-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-coral-500 mb-2">
          어떤 사진이에요?
        </div>
        <div className="grid grid-cols-4 gap-2">
          {HINTS.map((h) => (
            <button
              key={h.key}
              onClick={() => setHint(h.key)}
              className={`rounded-2xl py-3 px-1 transition-all press-down border ${
                hint === h.key
                  ? "bg-coral-500 text-white border-coral-500 shadow-clay"
                  : "surface text-default border-subtle"
              }`}
            >
              <div className="text-xl">{h.emoji}</div>
              <div className="text-[10px] font-bold mt-1">{h.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Extract */}
      {!extracted ? (
        <button
          onClick={extract}
          disabled={busy}
          className="btn-clay bg-coral-500 text-white disabled:opacity-50"
        >
          {busy ? "AI가 단어를 추출하고 있어요..." : "🔍 단어 추출하기"}
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl surface border border-subtle shadow-card p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <Mochi mood="happy" size={48} />
            <div>
              <div className="text-[10px] font-bold text-coral-500 uppercase tracking-widest">추출 완료</div>
              <div className="font-extrabold text-strong">{extracted.title}</div>
              <div className="text-[11px] text-muted">{extracted.items.length}개 단어를 찾았어요</div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {extracted.items.map((it, i) => (
              <div key={i} className="rounded-2xl surface-subtle p-3">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-lg font-black text-strong">{it.word}</span>
                  <span className="font-jp text-xs text-muted">{it.reading}</span>
                </div>
                <div className="text-sm font-bold text-default">{it.meaning}</div>
                {it.example_ja && (
                  <div className="mt-1.5 font-jp text-xs text-strong">{it.example_ja}</div>
                )}
              </div>
            ))}
          </div>
          <button onClick={save} className="btn-clay w-full mt-4 bg-teal-400 text-ink-700">
            ✓ 내 단어장에 저장
          </button>
          <button onClick={extract} disabled={busy} className="w-full mt-2 text-[11px] text-muted underline">
            다시 추출
          </button>
        </motion.div>
      )}
    </div>
  );
}
