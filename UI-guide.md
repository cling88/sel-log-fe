# Sellog — FE 퍼블리싱 가이드

> Cursor에게 전달하는 UI 개발 기준 및 초기 구현 가이드

---

## 기존 코드 초기화

```bash
# 기존 작업 전부 삭제 후 새로 시작
rm -rf src/app src/components src/hooks src/lib src/styles
```

---

## 기술 스택

| 항목 | 기술 |
|------|------|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + CSS Variables |
| UI 컴포넌트 | shadcn/ui |
| 아이콘 | lucide-react |
| 폰트 | Pretendard (한글) + DM Sans (영문/숫자) |
| 애니메이션 | Framer Motion |
| 상태관리 | Jotai |
| 서버상태 | TanStack Query |

---

## 추가 설치 라이브러리

```bash
# shadcn/ui 초기화
npx shadcn@latest init

# shadcn 컴포넌트
npx shadcn@latest add button input label select dialog badge card tabs sheet tooltip dropdown-menu separator skeleton

# 추가 패키지
npm install framer-motion
npm install jotai
npm install @tanstack/react-query
npm install @tanstack/react-table
npm install recharts
npm install date-fns
npm install axios
npm install @supabase/supabase-js
npm install exceljs

# 폰트
npm install @fontsource/dm-sans
```

---

## 디자인 시스템

### 컬러 팔레트

```css
/* globals.css */
:root {
  /* Primary — 짙은 남색 */
  --primary-950: #0A0F1E;
  --primary-900: #0D1426;
  --primary-800: #111D3D;
  --primary-700: #162554;
  --primary-600: #1B2E6B;
  --primary-500: #1E3A8A;   /* 메인 컬러 */
  --primary-400: #2563EB;
  --primary-300: #3B82F6;
  --primary-200: #93C5FD;
  --primary-100: #DBEAFE;
  --primary-50:  #EFF6FF;

  /* Semantic */
  --color-bg:           #F8F9FC;
  --color-bg-card:      #FFFFFF;
  --color-bg-sidebar:   #0D1426;
  --color-border:       #E4E7EF;
  --color-border-dark:  #1E2D4A;

  --color-text-primary:   #0A0F1E;
  --color-text-secondary: #4B5675;
  --color-text-muted:     #8B95A9;
  --color-text-inverse:   #FFFFFF;

  --color-success:  #10B981;
  --color-warning:  #F59E0B;
  --color-danger:   #EF4444;
  --color-info:     #3B82F6;

  /* 지출 (빨간) / 수익 (초록) */
  --color-expense:  #EF4444;
  --color-income:   #10B981;

  /* Radius */
  --radius-sm:  4px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-xl:  16px;

  /* Shadow */
  --shadow-sm: 0 1px 3px rgba(10,15,30,0.06), 0 1px 2px rgba(10,15,30,0.04);
  --shadow-md: 0 4px 12px rgba(10,15,30,0.08), 0 2px 6px rgba(10,15,30,0.05);
  --shadow-lg: 0 8px 24px rgba(10,15,30,0.10), 0 4px 12px rgba(10,15,30,0.06);
}
```

### 폰트 설정

```css
/* globals.css */
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

:root {
  --font-sans: 'Pretendard', 'DM Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-display: 'DM Sans', 'Pretendard', sans-serif;
}

body {
  font-family: var(--font-sans);
  background-color: var(--color-bg);
  color: var(--color-text-primary);
  -webkit-font-smoothing: antialiased;
}
```

### 공통 컴포넌트 스타일 기준

```
카드:       bg-white, border border-[var(--color-border)], rounded-xl, shadow-sm
버튼(primary): bg-[var(--primary-500)] text-white hover:bg-[var(--primary-600)]
버튼(ghost):  bg-transparent hover:bg-[var(--primary-50)] text-[var(--color-text-secondary)]
인풋:       border border-[var(--color-border)] rounded-lg focus:ring-2 focus:ring-[var(--primary-300)]
배지(양수):  bg-emerald-50 text-emerald-700
배지(음수):  bg-red-50 text-red-600
```

---

## 페이지 구성

```
/               → /dashboard 리다이렉트 (로그인 여부 확인)
/login          → 로그인 페이지
/dashboard      → 대시보드 (빈 화면, 로그인 기본 페이지)
/ledger         → 장부 (?tab=purchase|sale|income|products)
```

---

## 레이아웃 구조

### PC/태블릿 — GNB (상단 고정)

```
┌────────────────────────────────────────────────────────────┐
│  [S] Sellog    대시보드    장부    설정           [로그아웃]  │
│  ← bg: var(--primary-900), height: 60px, sticky top        │
└────────────────────────────────────────────────────────────┘
```

### 모바일 — 하단 탭바

```
┌────────────────────────────────┐
│  [페이지 컨텐츠]                │
├────────────────────────────────┤
│  🏠 대시보드  📋 장부  ⚙️ 설정  │
│  ← 하단 고정, height: 64px     │
└────────────────────────────────┘
```

**레이아웃 파일: `src/app/(main)/layout.tsx`**

```tsx
// 구현 기준
// - GNB: sticky top-0 z-50, bg-[var(--primary-900)]
// - 컨텐츠 영역: max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8
// - 모바일(< 768px): GNB 숨기고 하단 탭바 표시
// - 로그인 체크: 미로그인 시 /login 리다이렉트
```

---

## 1. 로그인 `/login`

**레이아웃:**
- 전체 화면 중앙 정렬
- 배경: 좌측 남색 패널(PC) + 우측 로그인 폼 2컬럼 / 모바일 단일 컬럼

**구현 기준:**

```
┌──────────────────┬──────────────────┐
│                  │                  │
│  [S] Sellog      │  로그인           │
│                  │                  │
│  셀러를 위한      │  이메일           │
│  스마트한 장부    │  [____________]  │
│                  │                  │
│  bg: primary-900 │  비밀번호         │
│  text: white     │  [____________]  │
│                  │                  │
│                  │  [로그인]         │
│                  │                  │
└──────────────────┴──────────────────┘
```

**스펙:**
- 좌측 패널: `bg-[var(--primary-900)]`, 로고 + 서비스 소개 문구
- 우측 폼: `bg-white`, max-width 400px, 중앙 정렬
- 에러: 폼 상단 빨간 배너 (`bg-red-50 border border-red-200 text-red-700`)
- 로그인 성공: `/dashboard` 리다이렉트
- 회원가입 없음 (링크/버튼 표시 안 함)
- 모바일: 좌측 패널 숨기고 폼만 표시, 상단에 로고

---

## 2. 대시보드 `/dashboard`

**현재는 빈 화면. 로그인 후 기본 랜딩 페이지.**

```tsx
// 구현 기준
// - GNB "대시보드" 활성화
// - 중앙에 "대시보드 준비 중입니다." 텍스트 표시 (추후 구현)
// - 페이지 타이틀: "대시보드"
```

---

## 3. 장부 `/ledger`

### 장부 상단 공통 레이아웃

**추이 섹션 (항상 고정):**

```
┌─────────────────────────────────────────────────────────┐
│  [ 전체 ] [ 올해 ] [ 이번달 ] [ 주간 ] [ 오늘 ]          │
│  ← 토글 버튼, 선택된 항목: bg-white text-primary-500    │
│    미선택: text-white/70                                 │
├─────────────────────────────────────────────────────────┤
│  [ 년도 ▼ ] or [ 월 ▼ ] or [ 주 ▼ ]                   │
│  ← 선택된 기간 유형에 따라 1개만 표시, 전체/오늘은 없음  │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ 매입      │  │ 매출     │  │ 수익     │              │
│  │ 000,000원 │  │ 000,000원│  │ 000,000원│              │
│  │ 000건    │  │ 000건    │  │ ▲12%    │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                              순수익 000,000원            │
└─────────────────────────────────────────────────────────┘
```

**월 선택 + 탭 (매입/매출/수익 탭일 때만 월선택 표시):**

```
┌─────────────────────────────────────────────────────────┐
│  [ 2026년 5월 ▼ ]   ← 상품관리 탭 클릭 시 숨김          │
├─────────────────────────────────────────────────────────┤
│  [ 매입 ] [ 매출 ] [ 수익 ] [ 상품관리 ]                 │
│  ← 활성 탭: border-b-2 border-white text-white          │
│     비활성: text-white/50 hover:text-white/80           │
└─────────────────────────────────────────────────────────┘
```

**구현 기준:**
- 추이 섹션 배경: `bg-[var(--primary-800)]`
- 탭 배경: `bg-[var(--primary-900)]`
- 요약 카드: `bg-white/10 backdrop-blur rounded-xl`
- 전체 탭 제외 나머지 4개에 이전기간 대비 증감 표시 (▲ 초록 / ▼ 빨강)

---

### 탭 공통 구현 기준

```tsx
// /ledger 페이지
// - URL 쿼리로 탭 관리: ?tab=purchase|sale|income|products
// - 탭 전환 시 URL 변경 (뒤로가기 가능)
// - 상품관리 탭 활성화 시 월선택 영역 숨김
// - 모든 목록은 table 태그 대신 div로 구현 (반응형 필수)
```

---

### 탭별 빈 화면 (Skeleton/Empty State)

각 탭은 일단 빈 화면으로 구현. 데이터 없을 시 empty state 표시.

```
┌────────────────────────────────┐
│                                │
│    📋                          │
│    아직 등록된 내역이 없어요.    │
│    [+ 매입 등록하기]            │
│                                │
└────────────────────────────────┘
```

---

## 반응형 브레이크포인트

```
모바일:  < 768px   → 하단 탭바, 단일 컬럼
태블릿:  768~1024px → GNB, 2컬럼
PC:      > 1024px  → GNB, 최대 1280px
```

```tsx
// Tailwind 기준
// sm: 640px / md: 768px / lg: 1024px / xl: 1280px
// 모바일 first로 작성
```

---

## 디렉토리 구조

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (main)/
│   │   ├── layout.tsx         ← GNB + 하단탭바 + 로그인 체크
│   │   ├── dashboard/
│   │   │   └── page.tsx       ← 빈 화면
│   │   └── ledger/
│   │       └── page.tsx       ← 탭 구조 (빈 탭 컨텐츠)
│   ├── globals.css
│   ├── layout.tsx             ← QueryProvider + Jotai
│   └── providers.tsx
│
├── components/
│   ├── ui/                    ← shadcn/ui (수정 금지)
│   ├── layout/
│   │   ├── gnb.tsx            ← 상단 네비게이션
│   │   └── mobile-tab-bar.tsx ← 하단 탭바
│   ├── ledger/
│   │   ├── ledger-header.tsx  ← 추이 섹션 + 월선택 + 탭
│   │   └── empty-state.tsx    ← 빈 화면 공통 컴포넌트
│   └── common/
│       └── loading-skeleton.tsx
│
├── lib/
│   ├── auth-atoms.ts          ← Jotai 로그인 상태
│   └── utils.ts               ← cn(), 숫자/날짜 포맷
│
└── types/
    └── common.ts
```

---

## 환경변수 `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Cursor 작업 지시 순서

```
1. "퍼블가이드.md 읽고 globals.css 디자인 시스템 세팅해줘"

2. "퍼블가이드.md 읽고 (main)/layout.tsx 만들어줘.
    GNB(PC)와 하단탭바(모바일) 포함. 로그인 체크 로직 포함"

3. "퍼블가이드.md 읽고 /login 페이지 만들어줘.
    좌측 남색 패널 + 우측 로그인 폼 2컬럼 레이아웃.
    모바일은 폼만 표시"

4. "퍼블가이드.md 읽고 /dashboard 페이지 만들어줘.
    현재는 빈 화면. '대시보드 준비 중입니다.' 텍스트만"

5. "퍼블가이드.md + 서비스로직.md 읽고 /ledger 페이지 만들어줘.
    장부 상단 공통 레이아웃 (추이 섹션 + 월선택 + 탭).
    각 탭 컨텐츠는 empty state만 표시"
```

---

## 주의사항 (Cursor에게)

```
- table 태그 사용 금지 → div로 구현 (반응형 필수)
- 컬러는 반드시 CSS Variables 사용 (하드코딩 금지)
- shadcn/ui 컴포넌트 수정 금지
- 모바일 first로 작성 (sm: md: lg: 순서)
- 로그인 체크는 layout.tsx에서 처리
- 폰트: Pretendard (한글), DM Sans (영문/숫자)
- 애니메이션: Framer Motion 사용
```

---

*퍼블 가이드 v1 — 로그인/대시보드(빈화면)/장부 기본 구조*
*최종 수정: 2026-05-29*