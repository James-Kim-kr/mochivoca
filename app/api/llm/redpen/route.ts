import { NextRequest, NextResponse } from "next/server";

interface RequestBody {
  target_word: { kanji: string; kana: string; meaning: string };
  sentence: string;
}

export interface RedPenResult {
  score: number; // 1-5
  praise: string;
  corrected: string | null;
  natural_alternative: string | null;
  nuance_tip: string;
  note: string;
}

function containsTarget(sentence: string, kanji: string, kana: string) {
  return sentence.includes(kanji) || sentence.includes(kana);
}

function looksJapanese(s: string) {
  return /[ぁ-んァ-ン一-龯]/.test(s);
}

function detectIssues(s: string) {
  const issues: string[] = [];
  if (s.length < 5) issues.push("문장이 너무 짧아요. 조금만 더 길게 써볼까요?");
  if (!/[。！？]/.test(s)) issues.push("문장 끝에 마침표(。)를 붙여보세요");
  if (/[가-힣]/.test(s)) issues.push("한국어가 섞여 있어요. 일본어로만 작성해보세요");
  if (/です\s*です|ます\s*ます/.test(s)) issues.push("정중체가 두 번 반복되었어요");
  return issues;
}

const PRAISES = [
  "잘 썼어요! 모찌가 박수치고 있어요 👏",
  "느낌이 자연스러워요. 일본인이 들어도 이해할 거예요!",
  "단어를 잘 살렸네요. 멋져요!",
  "조금만 다듬으면 완벽해요!",
];

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const { target_word, sentence } = body;

  await new Promise((r) => setTimeout(r, 700));

  if (!sentence || sentence.trim().length === 0) {
    return NextResponse.json<RedPenResult>({
      score: 1,
      praise: "아직 문장이 비어있어요! 단어를 활용해서 짧게라도 한 문장 써보세요 🌱",
      corrected: null,
      natural_alternative: null,
      nuance_tip: `「${target_word.kanji}」를 주어로 시작해보면 쉬워요.`,
      note: "mock",
    });
  }

  const hasTarget = containsTarget(sentence, target_word.kanji, target_word.kana);
  const issues = detectIssues(sentence);
  const isJp = looksJapanese(sentence);

  let score = 5;
  if (!hasTarget) score -= 2;
  if (!isJp) score -= 1;
  score -= Math.min(2, issues.length);
  score = Math.max(1, score);

  const corrected = (() => {
    let s = sentence.trim();
    if (!/[。！？]$/.test(s)) s = s + "。";
    return s !== sentence ? s : null;
  })();

  const naturalAlt = !hasTarget
    ? `${target_word.kanji}を使った例: 「私は${target_word.kanji}が好きです。」`
    : sentence.length < 12
    ? `もう少し詳しく: 「${sentence.replace(/[。！？]$/, "")}、とても楽しいです。」`
    : null;

  const tip = !hasTarget
    ? `미션 단어 「${target_word.kanji}」(${target_word.meaning})를 꼭 포함해서 다시 써보세요!`
    : issues.length > 0
    ? issues[0]
    : `「${target_word.kanji}」을(를) 자연스럽게 잘 활용했어요. ${target_word.kana} 발음도 연습해보세요!`;

  return NextResponse.json<RedPenResult>({
    score,
    praise: PRAISES[Math.min(PRAISES.length - 1, score - 2)] ?? PRAISES[0],
    corrected,
    natural_alternative: naturalAlt,
    nuance_tip: tip,
    note: "mock",
  });
}
