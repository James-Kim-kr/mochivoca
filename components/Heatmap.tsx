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

const CELL = 14;          // px — cell width/height
const GAP = 3;            // px — gap between cells/columns
const DAY_COL_W = 20;     // px — day label column width
const ROW_GAP = 6;        // px — gap between day-label col and grid col

export default function Heatmap({ data, weeks = 14 }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();
  const totalDays = weeks * 7;
  const startDow = today.getDay();
  // Anchor the grid so that today sits in the last column.
  // The last column spans Sun→Sat of this week; pad future days at the end.
  const start = new Date(today);
  start.setDate(today.getDate() - (totalDays - 1 - (6 - startDow)));

  type Cell = { date: Date; key: string; count: number; future: boolean };
  const cells: Cell[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const k = dayKey(d.getTime());
    cells.push({
      date: d,
      key: k,
      count: data[k] ?? 0,
      future: d.getTime() > todayTs,
    });
  }
  const columns: Cell[][] = [];
  for (let w = 0; w < weeks; w++) columns.push(cells.slice(w * 7, w * 7 + 7));

  // Month label per column: show the month name on the first column whose
  // Sunday is in a new month (relative to the previous column's Sunday).
  const labelTops: (string | null)[] = columns.map((col, i) => {
    if (i === 0) return MONTHS[col[0].date.getMonth()] + "월";
    if (col[0].date.getMonth() !== columns[i - 1][0].date.getMonth())
      return MONTHS[col[0].date.getMonth()] + "월";
    return null;
  });

  // Sparse weekday labels (월/수/금 only)
  const dayLabel = (rowIdx: number) =>
    rowIdx === 1 ? "월" : rowIdx === 3 ? "수" : rowIdx === 5 ? "금" : "";

  const todayKey = dayKey(todayTs);

  // Layout: a single flex container so day labels + month labels + cells
  // all share the same column widths and gaps — guaranteed alignment.
  return (
    <div className="flex" style={{ gap: ROW_GAP }}>
      {/* Left column: spacer (matching month label row height) + day labels */}
      <div
        className="flex flex-col text-[9px] text-faint font-bold"
        style={{ gap: GAP, width: DAY_COL_W }}
      >
        <div style={{ height: 12 }} />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="leading-none flex items-center justify-end pr-0.5"
            style={{ height: CELL }}
          >
            {dayLabel(i)}
          </div>
        ))}
      </div>

      {/* Right side: month labels row + cells grid, sharing the same gap */}
      <div className="flex flex-col" style={{ gap: GAP }}>
        <div className="flex" style={{ gap: GAP, height: 12 }}>
          {labelTops.map((l, i) => (
            <div
              key={i}
              className="text-[9px] font-bold text-faint text-left leading-none"
              style={{ width: CELL }}
            >
              {l ?? ""}
            </div>
          ))}
        </div>
        <div className="flex" style={{ gap: GAP }}>
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col" style={{ gap: GAP }}>
              {col.map((c) => {
                const isToday = c.key === todayKey;
                if (c.future) {
                  return (
                    <div
                      key={c.key}
                      title="아직 오지 않은 날"
                      className="rounded-[3px] border border-dashed border-subtle"
                      style={{ width: CELL, height: CELL }}
                    />
                  );
                }
                return (
                  <div
                    key={c.key}
                    title={`${c.key} · 정답 ${c.count}회`}
                    className={`rounded-[3px] ${colorClass(c.count)} ${
                      isToday ? "ring-2 ring-coral-500" : ""
                    }`}
                    style={{ width: CELL, height: CELL }}
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
