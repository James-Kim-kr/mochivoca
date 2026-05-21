// Mora parser for Japanese kana (hiragana/katakana)
// A mora is a sound unit. Small kana (ゃゅょゎぁぃぅぇぉっ) merges with the previous char.
// Long vowel mark ー counts as its own mora.

const SMALL_KANA = new Set([
  "ゃ", "ゅ", "ょ", "ゎ", "ぁ", "ぃ", "ぅ", "ぇ", "ぉ",
  "ャ", "ュ", "ョ", "ヮ", "ァ", "ィ", "ゥ", "ェ", "ォ",
]);

export function splitMora(kana: string): string[] {
  const moras: string[] = [];
  for (const ch of Array.from(kana)) {
    if (SMALL_KANA.has(ch) && moras.length > 0) {
      moras[moras.length - 1] += ch;
    } else {
      moras.push(ch);
    }
  }
  return moras;
}

export function moraCount(kana: string): number {
  return splitMora(kana).length;
}

// If pitch_pattern is missing, generate a heiban default (low then high until end).
// pitch_pattern: 0=low, 1=high. Length matches mora count.
export function getPitchPattern(kana: string, pattern?: number[]): number[] {
  if (pattern && pattern.length > 0) return pattern;
  const n = moraCount(kana);
  if (n <= 1) return [0];
  // heiban: first mora low, rest high
  return [0, ...Array(n - 1).fill(1)];
}

export type PitchType = "heiban" | "atamadaka" | "nakadaka" | "odaka" | "unknown";

export function classifyPitch(pattern: number[]): PitchType {
  if (pattern.length === 0) return "unknown";
  if (pattern[0] === 1 && pattern.slice(1).every((p) => p === 0)) return "atamadaka";
  if (pattern[0] === 0 && pattern.slice(1).every((p) => p === 1)) return "heiban";
  // find drop
  let high = false;
  let droppedAtEnd = false;
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === 1) high = true;
    if (high && pattern[i] === 0) {
      droppedAtEnd = i === pattern.length - 1;
      return droppedAtEnd ? "odaka" : "nakadaka";
    }
  }
  return "unknown";
}
