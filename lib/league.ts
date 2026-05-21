import type { LeagueTier } from "./store";

export interface LeagueMember {
  rank: number;
  user_id: string;
  nickname: string;
  exp: number;
  is_me: boolean;
  tier: LeagueTier;
}

// Mulberry32 — deterministic PRNG seeded by an integer
function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t |= 0;
    t = (t + 0x6D2B79F5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const NICK_POOL = [
  "도쿄러너", "초밥장인", "오사카토끼", "교토산책", "하카타맘",
  "라멘파이터", "후지등산가", "센다이별빛", "삿포로눈사람", "오키나와파도",
  "신주쿠밤거리", "시부야교차로", "긴자쇼퍼", "아키하바라너드", "우에노판다",
  "나라사슴이", "히로시마평화", "후쿠오카포차", "요코하마등대", "고베야경",
  "야마노테순례", "지하철러시", "벚꽃엔딩", "단풍여행가", "온천콩알이",
  "마츠리북소리", "이자카야단골", "신칸센광속", "다코야키마니아", "스시롤매니아",
];

const TIER_BASE: Record<LeagueTier, { mean: number; sd: number }> = {
  BRONZE: { mean: 250, sd: 120 },
  SILVER: { mean: 600, sd: 200 },
  GOLD: { mean: 1100, sd: 280 },
  DIAMOND: { mean: 1800, sd: 360 },
};

function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Sample from a roughly-normal distribution
function sampleExp(rand: () => number, mean: number, sd: number): number {
  // Box-Muller transform
  const u1 = Math.max(1e-6, rand());
  const u2 = rand();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(0, Math.round(mean + z * sd));
}

export function generateLeague(
  weekStart: number,
  tier: LeagueTier,
  myUserKey: string | null,
  myExp: number
): LeagueMember[] {
  const seed = hash(`${weekStart}|${tier}|${myUserKey ?? "anon"}`);
  const rand = mulberry32(seed);
  const params = TIER_BASE[tier];

  // 29 opponents + me
  const opponents: Omit<LeagueMember, "rank" | "is_me" | "tier">[] = [];
  for (let i = 0; i < 29; i++) {
    const idx = Math.floor(rand() * NICK_POOL.length);
    const nick = NICK_POOL[idx];
    const suffix = Math.floor(rand() * 9000 + 1000);
    opponents.push({
      user_id: `op_${i}`,
      nickname: `${nick}${suffix}`,
      exp: sampleExp(rand, params.mean, params.sd),
    });
  }

  const all: LeagueMember[] = [
    ...opponents.map((o) => ({ ...o, rank: 0, is_me: false, tier })),
    {
      user_id: myUserKey ?? "me",
      nickname: "나",
      exp: myExp,
      rank: 0,
      is_me: true,
      tier,
    },
  ];

  // sort by exp descending, stable tiebreak by nickname
  all.sort((a, b) => b.exp - a.exp || a.nickname.localeCompare(b.nickname));
  all.forEach((m, i) => (m.rank = i + 1));
  return all;
}

export const PROMOTION_RANK = 5;
export const DEMOTION_MIN_RANK = 26;

export function nextTier(t: LeagueTier): LeagueTier {
  const i = (["BRONZE", "SILVER", "GOLD", "DIAMOND"] as LeagueTier[]).indexOf(t);
  return i < 3 ? (["BRONZE", "SILVER", "GOLD", "DIAMOND"] as LeagueTier[])[i + 1] : t;
}
export function prevTier(t: LeagueTier): LeagueTier {
  const i = (["BRONZE", "SILVER", "GOLD", "DIAMOND"] as LeagueTier[]).indexOf(t);
  return i > 0 ? (["BRONZE", "SILVER", "GOLD", "DIAMOND"] as LeagueTier[])[i - 1] : t;
}

export function tierMeta(t: LeagueTier) {
  return {
    BRONZE: { label: "브론즈", color: "#B07A3D", emoji: "🥉" },
    SILVER: { label: "실버", color: "#9CA3AF", emoji: "🥈" },
    GOLD: { label: "골드", color: "#F5A524", emoji: "🥇" },
    DIAMOND: { label: "다이아몬드", color: "#3FC7A5", emoji: "💎" },
  }[t];
}
