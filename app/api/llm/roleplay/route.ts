import { NextRequest, NextResponse } from "next/server";

export interface RoleplayMessage {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  scenario: {
    situation: string;
    ai_role: string;
    initial_msg: string;
  };
  mission_keywords: string[];
  history: RoleplayMessage[];
  user_input: string;
  turn: number; // current user turn (1..4)
}

const TURN_RESPONSES: Record<number, (used: string[], allMissions: string[], ai_role: string) => string> = {
  1: (used) => {
    const acknowledged = used.length > 0
      ? `${used.map((w) => `「${w}」`).join("と")}ですね、なるほど〜！`
      : "なるほど〜！";
    return `${acknowledged}じゃあ、もう少し詳しく聞かせてもらえますか？`;
  },
  2: (used, all) => {
    const remaining = all.filter((k) => !used.includes(k));
    if (remaining.length > 0) {
      return `いいですね！ところで、${remaining[0]} のことはどうですか？`;
    }
    return `素敵ですね！じゃあ、最後に確認させてもらいますね。`;
  },
  3: (used, all) => {
    const ok = all.every((k) => used.includes(k));
    if (ok) {
      return `完璧です！ご来店ありがとうございました！またお会いしましょう〜🍡`;
    }
    return `ありがとうございます！またお会いできるのを楽しみにしています〜！`;
  },
};

function detectKeywords(text: string, keywords: string[]): string[] {
  return keywords.filter((k) => text.includes(k));
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { mission_keywords, history, user_input, turn, scenario } = body;

  // Aggregate all used keywords across all user turns so we can track mission progress
  const allUsed = new Set<string>();
  for (const m of history) {
    if (m.role === "user") {
      detectKeywords(m.content, mission_keywords).forEach((k) => allUsed.add(k));
    }
  }
  detectKeywords(user_input, mission_keywords).forEach((k) => allUsed.add(k));
  const used = Array.from(allUsed);

  const responder = TURN_RESPONSES[turn] ?? TURN_RESPONSES[3];
  const aiContent = responder(used, mission_keywords, scenario.ai_role);

  // Tiny artificial latency for natural feel
  await new Promise((r) => setTimeout(r, 600));

  const done = turn >= 3 && mission_keywords.every((k) => allUsed.has(k));
  const ended = turn >= 4 || done;

  return NextResponse.json({
    assistant: aiContent,
    used_keywords: used,
    mission_complete: done,
    ended,
    note: "mock", // swap this provider to real LLM by changing the route impl
  });
}
