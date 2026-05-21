import { NextRequest, NextResponse } from "next/server";

export interface ScrapExtractRequest {
  hint?: string;
  filename?: string;
}

export interface ScrapExtractItem {
  word: string;
  reading: string;
  meaning: string;
  context_snippet: string;
  example_ja: string;
  example_ko: string;
}

export interface ScrapExtractResponse {
  title: string;
  items: ScrapExtractItem[];
  note: string;
}

const POOLS: Record<string, { title: string; items: ScrapExtractItem[] }> = {
  menu: {
    title: "라멘 가게 메뉴판",
    items: [
      { word: "限定", reading: "げんてい", meaning: "한정",
        context_snippet: "사진의 '나고야 점 한정 메뉴' 영역에서 추출",
        example_ja: "この店舗は名古屋限定の商品を販売しています。",
        example_ko: "이 점포는 나고야 한정 상품을 판매하고 있습니다." },
      { word: "替え玉", reading: "かえだま", meaning: "면 추가",
        context_snippet: "메뉴 하단 '替え玉 +100円' 영역",
        example_ja: "すみません、替え玉お願いします。",
        example_ko: "저기요, 면 추가 부탁드려요." },
      { word: "辛さ", reading: "からさ", meaning: "매운맛 (정도)",
        context_snippet: "'辛さ 1~5 で選べます' 영역",
        example_ja: "辛さは普通でお願いします。",
        example_ko: "매운맛은 보통으로 부탁드려요." },
    ],
  },
  sign: {
    title: "거리 간판",
    items: [
      { word: "入口", reading: "いりぐち", meaning: "입구",
        context_snippet: "건물 입구 안내판",
        example_ja: "入口はこちらです。",
        example_ko: "입구는 이쪽입니다." },
      { word: "禁煙", reading: "きんえん", meaning: "금연",
        context_snippet: "벽에 부착된 안내판",
        example_ja: "ここは禁煙席です。",
        example_ko: "여기는 금연석입니다." },
      { word: "営業中", reading: "えいぎょうちゅう", meaning: "영업 중",
        context_snippet: "가게 입구 매달린 팻말",
        example_ja: "ただいま営業中です。",
        example_ko: "지금 영업 중입니다." },
    ],
  },
  subway: {
    title: "지하철 안내",
    items: [
      { word: "乗り換え", reading: "のりかえ", meaning: "환승",
        context_snippet: "역 안내판 환승 표시",
        example_ja: "新宿駅で乗り換えてください。",
        example_ko: "신주쿠역에서 환승해 주세요." },
      { word: "切符", reading: "きっぷ", meaning: "표, 티켓",
        context_snippet: "발권기 위 안내문",
        example_ja: "切符を買ってから入ってください。",
        example_ko: "표를 사고 들어가 주세요." },
      { word: "改札口", reading: "かいさつぐち", meaning: "개찰구",
        context_snippet: "역 내부 안내판",
        example_ja: "改札口は左側です。",
        example_ko: "개찰구는 왼쪽에 있습니다." },
    ],
  },
  cafe: {
    title: "카페 메뉴",
    items: [
      { word: "抹茶", reading: "まっちゃ", meaning: "말차",
        context_snippet: "메뉴 음료 섹션 상단",
        example_ja: "抹茶ラテをひとつください。",
        example_ko: "말차 라떼 하나 주세요." },
      { word: "持ち帰り", reading: "もちかえり", meaning: "테이크아웃",
        context_snippet: "주문 옵션 영역",
        example_ja: "持ち帰りでお願いします。",
        example_ko: "테이크아웃으로 부탁드려요." },
      { word: "割引", reading: "わりびき", meaning: "할인",
        context_snippet: "프로모션 배너",
        example_ja: "今日は10%割引です。",
        example_ko: "오늘은 10% 할인입니다." },
    ],
  },
};

function pickPool(hint?: string, filename?: string): keyof typeof POOLS {
  const target = `${hint ?? ""} ${filename ?? ""}`.toLowerCase();
  if (/menu|메뉴|ramen|라멘|sushi|초밥/.test(target)) return "menu";
  if (/sign|간판|signage/.test(target)) return "sign";
  if (/subway|train|역|station|지하철/.test(target)) return "subway";
  if (/cafe|coffee|카페/.test(target)) return "cafe";
  const keys = Object.keys(POOLS) as (keyof typeof POOLS)[];
  return keys[Math.floor(Math.random() * keys.length)];
}

export async function POST(req: NextRequest) {
  let body: ScrapExtractRequest = {};
  try {
    body = (await req.json()) as ScrapExtractRequest;
  } catch {}
  await new Promise((r) => setTimeout(r, 900));
  const pool = POOLS[pickPool(body.hint, body.filename)];
  return NextResponse.json<ScrapExtractResponse>({
    title: pool.title,
    items: pool.items,
    note: "mock",
  });
}
