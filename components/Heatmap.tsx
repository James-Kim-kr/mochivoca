"use client";

import { dayKey } from "@/lib/store";

interface Props {
  data: Record<string, number>;
  weeks?: number;
}

function colorClass(count: number): string {
  if (count <= 0) return "bg-ink-100 dark:bg-ink-700";
  if (count < 5) return "bg-teal-100 dark:bg-teal-500/30";
  if (count < 10) return "bg-teal-200 dark:bg-teal-500/50";
  if (count < 20) return "bg-teal-400 dark:bg-teal-400";
  return "bg-teal-600 dark:bg-teal-300";
}

const MONTHS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export default function Heatmap({ data, weeks = 14 }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const totalDays = weeks * 7;
  const startDow = today.getDay();
  const start = new Date(today);
  start.setDate(today.getDate() - (totalDays - 1 - (6 - startDow)));

  const cells: { date: Date; key: string; count: number }[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({ date: d, key: dayKey(d.getTime()), count: data[dayKey(d.getTime())] ?? 0 });
  }
  const columns: typeof cells[] = [];
  for (let w = 0; w < weeks; w++) columns.push(cells.slice(w * 7, w * 7 + 7));

  // Month labels — show month number on first column of each month
  const monthLabels = columns.map((col) => {
    const first = col[0];
    return { month: first.date.getMonth(), day: first.date.getDate() };
  });
  const labelTops: (string | null)[] = monthLabels.map((m, i) => {
    if (i === 0) return MONTHS[m.month] + "월";
    if (m.month !== monthLabels[i - 1].month) return MONTHS[m.month] + "월";
    return null;
  });

  const dayLabels = ["월", "수", "금"]; // sparse
  const todayKey = dayKey(Date.now());

  return (
    <div>
      <div className="flex gap-1.5 pl-7 mb-1">
        {labelTops.map((l, i) => (
          <div key={i} className="w-[14px] text-[9px] font-bold text-faint text-center">
            {l ?? ""}
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        <div className="flex flex-col gap-[3px] py-[1px] text-[9px] text-faint font-bold w-5">
          {[0,1,2,3,4,5,6].map((i) => (
            <div key={i} className="h-[14px] leading-[14px]">
              {i === 1 ? dayLabels[0] : i === 3 ? dayLabels[1] : i === 5 ? dayLabels[2] : ""}
            </div>
          ))}
        </div>
        <div className="flex gap-[3px]">
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col gap-[3px]">
              {col.map((c) => {
                const isToday = c.key === todayKey;
                return (
                  <div
                    key={c.key}
                    title={`${c.key} · ${c.count}개`}
                    className={`w-[14px] h-[14px] rounded-[3px] ${colorClass(c.count)} ${
                      isToday ? "ring-2 ring-coral-500" : ""
                    }`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
