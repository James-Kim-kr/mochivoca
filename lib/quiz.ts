import type { Word } from "./words";

export type QuestionType = "kanji-to-kana" | "context-fill";

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  prompt: string;       // displayed prompt (kanji or sentence with blank)
  hint?: string;        // optional small line (e.g., POS, meaning)
  correctIndex: number;
  choices: string[];
  word: Word;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(pool: Word[], correct: Word, n: number, by: "kana" | "word"): string[] {
  const seen = new Set<string>([by === "kana" ? correct.kana : correct.kanji]);
  const out: string[] = [];
  const shuffled = shuffle(pool);
  for (const w of shuffled) {
    const v = by === "kana" ? w.kana : w.kanji;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
    if (out.length >= n) break;
  }
  return out;
}

export function buildQuiz(pool: Word[], count = 10): QuizQuestion[] {
  if (pool.length < 5) return [];
  const picks = shuffle(pool).slice(0, count);
  return picks.map((w, i): QuizQuestion => {
    const isContext = !!w.example_ja && Math.random() < 0.5;
    if (isContext && w.example_ja) {
      // Build sentence with blank
      let blanked = w.example_ja.replace(w.kanji, "＿＿＿");
      if (blanked === w.example_ja) {
        // fallback: blank the kana form
        blanked = w.example_ja.replace(w.kana, "＿＿＿");
      }
      const distractors = pickDistractors(pool, w, 3, "word");
      const choices = shuffle([w.kanji, ...distractors]);
      return {
        id: `q-${i}-${w.id}`,
        type: "context-fill",
        prompt: blanked,
        hint: w.meaning,
        correctIndex: choices.indexOf(w.kanji),
        choices,
        word: w,
      };
    }
    const distractors = pickDistractors(pool, w, 3, "kana");
    const choices = shuffle([w.kana, ...distractors]);
    return {
      id: `q-${i}-${w.id}`,
      type: "kanji-to-kana",
      prompt: w.kanji,
      hint: w.meaning,
      correctIndex: choices.indexOf(w.kana),
      choices,
      word: w,
    };
  });
}

export function quizScore(correct: number, bestCombo: number, avgMs: number): number {
  const base = correct * 100;
  const comboBonus = bestCombo >= 3 ? (bestCombo - 2) * 30 : 0;
  const speedBonus = Math.max(0, Math.round((5000 - avgMs) / 50)); // faster = more
  return Math.max(0, base + comboBonus + speedBonus);
}
