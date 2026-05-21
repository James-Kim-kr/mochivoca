"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { JlptLevel, Word } from "./words";
import { getStageCount, getStageWords, getWordsByLevel } from "./words";
import { CardState, initialCard, reviewCard } from "./srs";

const DAILY_NEW = 10;
const DAILY_REVIEW = 15;

export function dayKey(ts = Date.now()): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysBetween(aKey: string, bKey: string): number {
  const a = new Date(aKey + "T00:00:00");
  const b = new Date(bKey + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export interface DailyLog {
  newCount: number;
  reviewCount: number;
  wrongCount: number;
  pointsEarned: number;
}

export interface WeakWord {
  wordId: string;
  wrongCount: number;
  lastTestedAt: number;
}

export interface ScrapItem {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  context_snippet?: string;
  example_ja?: string;
  example_ko?: string;
}

export interface Scrap {
  id: string;
  createdAt: number;
  title: string;
  imageDataUrl?: string;
  items: ScrapItem[];
}

export type LeagueTier = "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";

export interface LeagueState {
  tier: LeagueTier;
  weekStart: number;
  weeklyXp: number;
  lastWeekXp: number;
  lastWeekRank: number | null;
}

export const LEAGUE_TIERS: LeagueTier[] = ["BRONZE", "SILVER", "GOLD", "DIAMOND"];

export function weekStartTs(ts = Date.now()): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  const offset = dow === 0 ? 6 : dow - 1;
  d.setDate(d.getDate() - offset);
  return d.getTime();
}

export function nextWeekStartTs(ts = Date.now()): number {
  return weekStartTs(ts) + 7 * 24 * 60 * 60 * 1000;
}

function defaultLeague(): LeagueState {
  return {
    tier: "BRONZE",
    weekStart: weekStartTs(),
    weeklyXp: 0,
    lastWeekXp: 0,
    lastWeekRank: null,
  };
}

export interface AppState {
  userKey: string | null;
  level: JlptLevel | null;
  cards: Record<string, CardState>;
  lastStudyDay: string | null;
  streak: number;
  streakFreezeCount: number;
  todayCompleted: Record<string, number>;
  dailyLogs: Record<string, DailyLog>;
  totalXp: number;
  completedStages: Record<JlptLevel, number[]>;
  completedChallenges: Record<JlptLevel, number[]>;
  weakWords: Record<string, WeakWord>;
  scraps: Scrap[];
  league: LeagueState;
  bestQuizScore: number;
  bestCombo: number;
  handsFree: boolean;
  autoSpeak: boolean;

  setUserKey: (key: string | null) => void;
  setLevel: (level: JlptLevel) => void;
  setHandsFree: (v: boolean) => void;
  setAutoSpeak: (v: boolean) => void;
  resetAll: () => void;

  getDailyQueue: () => Word[];
  getStageQueue: (day: number) => Word[];

  unlockedDay: (level?: JlptLevel) => number;
  isStageUnlocked: (level: JlptLevel, day: number) => boolean;
  isStageCompleted: (level: JlptLevel, day: number) => boolean;
  isChallengeUnlocked: (level: JlptLevel, day: number) => boolean;
  isChallengeCompleted: (level: JlptLevel, day: number) => boolean;
  markStageComplete: (level: JlptLevel, day: number) => void;
  markChallengeComplete: (level: JlptLevel, day: number) => void;

  answer: (wordId: string, knew: boolean) => void;
  markSessionComplete: () => void;

  todayCount: () => number;
  dailyGoal: () => number;
  levelProgress: (level: JlptLevel) => { mastered: number; total: number; seen: number };

  addScrap: (scrap: Scrap) => void;
  deleteScrap: (id: string) => void;

  awardLeagueXp: (xp: number) => void;
  rolloverWeekIfNeeded: () => void;
  setLeagueTier: (tier: LeagueTier) => void;

  recordQuiz: (score: number, combo: number) => void;
}

const STORAGE_KEY_PREFIX = "mochivoca-state";

function emptyStages(): Record<JlptLevel, number[]> {
  return { N5: [], N4: [], N3: [], N2: [], N1: [] };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      userKey: null,
      level: null,
      cards: {},
      lastStudyDay: null,
      streak: 0,
      streakFreezeCount: 0,
      todayCompleted: {},
      dailyLogs: {},
      totalXp: 0,
      completedStages: emptyStages(),
      completedChallenges: emptyStages(),
      weakWords: {},
      scraps: [],
      league: defaultLeague(),
      bestQuizScore: 0,
      bestCombo: 0,
      handsFree: false,
      autoSpeak: true,

      setUserKey: (key) => set({ userKey: key }),
      setLevel: (level) => set({ level }),
      setHandsFree: (v) => set({ handsFree: v }),
      setAutoSpeak: (v) => set({ autoSpeak: v }),

      resetAll: () =>
        set({
          level: null,
          cards: {},
          lastStudyDay: null,
          streak: 0,
          streakFreezeCount: 0,
          todayCompleted: {},
          dailyLogs: {},
          totalXp: 0,
          completedStages: emptyStages(),
          completedChallenges: emptyStages(),
          weakWords: {},
          scraps: [],
          league: defaultLeague(),
          bestQuizScore: 0,
          bestCombo: 0,
        }),

      getDailyQueue: () => {
        const { level, cards } = get();
        if (!level) return [];
        const all = getWordsByLevel(level);
        const now = Date.now();
        const newCards: Word[] = [];
        const reviewCards: Word[] = [];
        for (const w of all) {
          const c = cards[w.id];
          if (!c) {
            if (newCards.length < DAILY_NEW) newCards.push(w);
          } else if (c.due <= now) {
            if (reviewCards.length < DAILY_REVIEW) reviewCards.push(w);
          }
        }
        return [...reviewCards, ...newCards];
      },

      getStageQueue: (day) => {
        const { level } = get();
        if (!level) return [];
        return getStageWords(level, day);
      },

      unlockedDay: (lvl) => {
        const level = lvl ?? get().level;
        if (!level) return 1;
        const completed = get().completedStages[level] ?? [];
        if (completed.length === 0) return 1;
        return Math.max(...completed) + 1;
      },

      isStageUnlocked: (level, day) => {
        if (day <= 1) return true;
        const completed = get().completedStages[level] ?? [];
        return completed.includes(day - 1);
      },

      isStageCompleted: (level, day) => {
        return (get().completedStages[level] ?? []).includes(day);
      },

      isChallengeUnlocked: (level, day) => {
        return (get().completedStages[level] ?? []).includes(day);
      },

      isChallengeCompleted: (level, day) => {
        return (get().completedChallenges[level] ?? []).includes(day);
      },

      markStageComplete: (level, day) => {
        set((state) => {
          const cur = state.completedStages[level] ?? [];
          if (cur.includes(day)) return state;
          return {
            completedStages: {
              ...state.completedStages,
              [level]: [...cur, day].sort((a, b) => a - b),
            },
          };
        });
      },

      markChallengeComplete: (level, day) => {
        set((state) => {
          const cur = state.completedChallenges[level] ?? [];
          if (cur.includes(day)) return state;
          return {
            completedChallenges: {
              ...state.completedChallenges,
              [level]: [...cur, day].sort((a, b) => a - b),
            },
            totalXp: state.totalXp + 50,
          };
        });
      },

      answer: (wordId, knew) => {
        set((state) => {
          const prev = state.cards[wordId] ?? initialCard(wordId);
          const next = reviewCard(prev, knew);
          const today = dayKey();
          const todayCompleted = { ...state.todayCompleted };
          if (knew) todayCompleted[today] = (todayCompleted[today] ?? 0) + 1;
          const isFirstSeen = prev.seen === 0;
          const log = state.dailyLogs[today] ?? { newCount: 0, reviewCount: 0, wrongCount: 0, pointsEarned: 0 };
          const earned = knew ? 10 : 2;
          const nextLog: DailyLog = {
            newCount: log.newCount + (isFirstSeen ? 1 : 0),
            reviewCount: log.reviewCount + (isFirstSeen ? 0 : 1),
            wrongCount: log.wrongCount + (knew ? 0 : 1),
            pointsEarned: log.pointsEarned + earned,
          };
          const weakWords = { ...state.weakWords };
          if (!knew) {
            const w = weakWords[wordId] ?? { wordId, wrongCount: 0, lastTestedAt: 0 };
            weakWords[wordId] = { wordId, wrongCount: w.wrongCount + 1, lastTestedAt: Date.now() };
          } else if (weakWords[wordId] && weakWords[wordId].wrongCount > 0) {
            // mastered the weak word — keep history but mark last tested
            weakWords[wordId] = { ...weakWords[wordId], lastTestedAt: Date.now() };
          }
          // Also drip XP into the weekly league bucket
          const league = { ...state.league, weeklyXp: state.league.weeklyXp + earned };
          return {
            cards: { ...state.cards, [wordId]: next },
            todayCompleted,
            dailyLogs: { ...state.dailyLogs, [today]: nextLog },
            totalXp: state.totalXp + earned,
            weakWords,
            league,
          };
        });
      },

      markSessionComplete: () => {
        set((state) => {
          const today = dayKey();
          if (state.lastStudyDay === today) return state;
          let streak = state.streak;
          let freeze = state.streakFreezeCount;
          if (state.lastStudyDay) {
            const diff = daysBetween(state.lastStudyDay, today);
            if (diff === 1) {
              streak = streak + 1;
            } else if (diff === 2 && freeze > 0) {
              // streak freeze auto-consumed for 1 missed day
              streak = streak + 1;
              freeze = freeze - 1;
            } else {
              streak = 1;
            }
          } else {
            streak = 1;
          }
          return { lastStudyDay: today, streak, streakFreezeCount: freeze };
        });
      },

      todayCount: () => {
        const today = dayKey();
        return get().todayCompleted[today] ?? 0;
      },

      dailyGoal: () => DAILY_NEW + DAILY_REVIEW,

      addScrap: (scrap) => set((s) => ({ scraps: [scrap, ...s.scraps] })),
      deleteScrap: (id) => set((s) => ({ scraps: s.scraps.filter((x) => x.id !== id) })),

      awardLeagueXp: (xp) =>
        set((state) => ({
          league: { ...state.league, weeklyXp: state.league.weeklyXp + xp },
          totalXp: state.totalXp + xp,
        })),

      rolloverWeekIfNeeded: () =>
        set((state) => {
          const cur = weekStartTs();
          if (state.league.weekStart === cur) return state;
          // Carry weeklyXp → lastWeekXp; rank/tier promotion handled by /league page
          return {
            league: {
              ...state.league,
              weekStart: cur,
              lastWeekXp: state.league.weeklyXp,
              weeklyXp: 0,
            },
          };
        }),

      setLeagueTier: (tier) => set((s) => ({ league: { ...s.league, tier } })),

      recordQuiz: (score, combo) =>
        set((state) => ({
          bestQuizScore: Math.max(state.bestQuizScore, score),
          bestCombo: Math.max(state.bestCombo, combo),
          totalXp: state.totalXp + score,
          league: { ...state.league, weeklyXp: state.league.weeklyXp + score },
        })),

      levelProgress: (level) => {
        const total = getWordsByLevel(level).length;
        if (total === 0) return { mastered: 0, total: 0, seen: 0 };
        const cards = get().cards;
        let mastered = 0;
        let seen = 0;
        for (const w of getWordsByLevel(level)) {
          const c = cards[w.id];
          if (!c) continue;
          seen += 1;
          if (c.box >= 5) mastered += 1;
        }
        return { mastered, total, seen };
      },
    }),
    {
      name: STORAGE_KEY_PREFIX,
      storage: createJSONStorage(() => localStorage),
      version: 3,
      migrate: (persisted) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        return {
          ...p,
          streakFreezeCount: p.streakFreezeCount ?? 0,
          completedChallenges: p.completedChallenges ?? emptyStages(),
          weakWords: p.weakWords ?? {},
          scraps: p.scraps ?? [],
          league: p.league ?? defaultLeague(),
          bestQuizScore: p.bestQuizScore ?? 0,
          bestCombo: p.bestCombo ?? 0,
        } as AppState;
      },
    }
  )
);

export function switchUser(userKey: string | null) {
  if (typeof window === "undefined") return;
  const storageName = userKey ? `${STORAGE_KEY_PREFIX}:${userKey}` : STORAGE_KEY_PREFIX;
  const current = useAppStore.persist.getOptions().name;
  if (current === storageName) return;
  useAppStore.persist.setOptions({ name: storageName });
  useAppStore.persist.rehydrate();
  useAppStore.setState({ userKey });
}

export { getStageCount };
