# 모찌보카 · MochiVoca 🍡

> 하루 10분, 귀엽게 일본어 단어를 마스터하는 JLPT 학습 웹앱

듀오링고 스타일의 게이미피케이션과 뇌과학 기반 플래시카드 학습법을 결합한 일본어 단어 학습 서비스입니다. 대학생·취준생·직장인 등 자투리 시간을 활용하고 싶은 성인 학습자를 위해 설계되었습니다.

## ✨ 주요 기능

### Phase 1 (MVP)
- JLPT N5 단어 110개 (예문 포함)
- 3-토글 플래시카드 (한자/히라가나/뜻 가리기)
- 스와이프 기반 알아요/몰라요 분류
- Leitner 박스 SRS (1·2·4·7·14·30일 복습 주기)
- 매일 학습량/스트릭 추적

### Phase 2 (v1.1)
- Web Speech API 기반 무료 ja-JP TTS (자동 발음)
- Day별 스테이지 분할 + 잠금/해금 진행
- GitHub 잔디 스타일 학습 히트맵
- 핸즈프리 오토플레이 모드 (이동 중 듣기 학습)
- Google OAuth 로그인 (NextAuth)
- 다크 모드 + 시스템 자동 감지

### Phase 3 (v1.2)
- 🎙️ **AI 쉐도잉 + 피치 액센트 시각화** — SVG 곡선 + 마이크 amplitude
- 💬 **마이크로 롤플레잉** — 4턴 대화 + 미션 키워드 자동 감지
- ✏️ **Red Pen 작문 첨삭** — 별점 평가 + 자연스러운 표현 제안
- 🔋 Wake Lock API (핸즈프리 시 화면 꺼짐 방지)
- 스트릭 프리즈 / 약점 단어 트래킹

## 🛠️ 기술 스택

- **Framework**: Next.js 14 (App Router) + React 18 + TypeScript
- **Styling**: Tailwind CSS + Framer Motion
- **State**: Zustand + persist (per-user localStorage)
- **Auth**: NextAuth v4 + Google OAuth
- **Fonts**: Pretendard Variable + Zen Maru Gothic
- **Audio**: Web Speech API (TTS) + SpeechRecognition (STT) + AudioContext

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local.example`을 `.env.local`로 복사하고 값을 채워주세요.

```bash
cp .env.local.example .env.local
```

필요한 값:

- `NEXTAUTH_SECRET` — 랜덤 시크릿 (생성: `openssl rand -base64 32`)
- `NEXTAUTH_URL` — `http://localhost:3001` (dev)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — [Google Cloud Console](https://console.cloud.google.com/apis/credentials) OAuth 2.0 클라이언트
  - 승인된 리디렉션 URI: `http://localhost:3001/api/auth/callback/google`

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3001](http://localhost:3001) 열기.

## 📁 프로젝트 구조

```
.
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth 핸들러
│   │   └── llm/                  # Mock LLM 엔드포인트 (roleplay, redpen)
│   ├── challenge/[day]/          # 실전 회화 챌린지
│   ├── login/ onboarding/        # 로그인·온보딩
│   ├── me/ settings/             # 마이페이지·설정
│   ├── study/ done/              # 학습·완료
│   ├── layout.tsx providers.tsx  # 루트 + 컨텍스트
│   └── page.tsx                  # 홈
├── components/
│   ├── Flashcard.tsx             # 카드 본체 (피치 + 쉐도잉 모달)
│   ├── PitchAccent.tsx           # 억양 SVG 시각화
│   ├── Shadowing.tsx             # 마이크 따라말하기
│   ├── RoleplayChat.tsx          # 4턴 롤플레이 UI
│   ├── RedPenWriting.tsx         # 작문 첨삭 UI
│   ├── StageMap.tsx BottomNav.tsx ThemeProvider.tsx ...
├── lib/
│   ├── words.ts                  # JLPT 단어 데이터
│   ├── store.ts                  # Zustand 상태 (per-user)
│   ├── srs.ts                    # Leitner 박스 SRS
│   ├── tts.ts shadowing.ts pitch.ts wakeLock.ts
│   └── auth.ts                   # NextAuth options
└── middleware.ts                 # 보호 라우트 미들웨어
```

## 🤖 LLM 연동 (선택)

현재 [`/api/llm/roleplay`](app/api/llm/roleplay/route.ts)와 [`/api/llm/redpen`](app/api/llm/redpen/route.ts)는 mock 응답입니다. 실제 LLM으로 교체하려면 핸들러 본문만 바꾸면 됩니다.

응답 스키마는 PRD v1.2 명세 그대로 유지했습니다.

## 🎨 디자인 시스템

- **컨셉**: Cozy Premium — 따뜻한 모찌 + 절제된 세련됨
- **팔레트**: 코랄(#FF6B47) 주조 + 틸(#1FAE89) 보조 + 잉크 텍스트
- **인터랙션**: 클레이모피즘 점토 버튼 (`btn-clay` `.press-down`)
- **반응형**: 모바일 우선 (max-w-md) + 하단 탭 네비게이션
- **접근성**: 다크 모드, 안전 영역, 햅틱-스타일 피드백

## 📜 라이선스

개인 학습용 프로젝트입니다.
