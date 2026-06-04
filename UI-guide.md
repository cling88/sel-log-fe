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
│  ◀  2026년  ▶                              [ 🔍 ]      │
│  ← 년도는 가운데 고정, 우측에 전역 검색 아이콘           │
├─────────────────────────────────────────────────────────┤
│  [ 1월 ] [ 2월 ] [ 3월 ] …  ← 엑셀 스타일 월 탭         │
├─────────────────────────────────────────────────────────┤
│  [ 매입 ] [ 매출 ] [ 수익 ] [ 상품관리 ]                 │
│  ← 활성 탭: border-b-2 border-white text-white          │
│     비활성: text-white/50 hover:text-white/80           │
└─────────────────────────────────────────────────────────┘
```

**본문 카드 (헤더 카드와 분리, gap 간격):**

- 상단 헤더(추이·년도·메인 탭) = 카드 1
- 하단(월 탭 + 탭 본문) = 카드 2
- 탭 본문 안에서 **요약/서브탭 설명**은 별도, **검색 툴바 + 목록**만 `LedgerListShell`로 한 카드에 묶음

**구현 기준:**
- 추이 섹션 배경: `bg-[var(--primary-800)]`
- 탭 배경: `bg-[var(--primary-900)]`
- 요약 카드: `bg-white/10 backdrop-blur rounded-xl`
- 전체 탭 제외 나머지 4개에 이전기간 대비 증감 표시 (▲ 초록 / ▼ 빨강)

---

### 장부 전역 검색 (헤더)

탭 내 검색(월 범위와 무관하게 **현재 탭 목록만** 필터)과 별도로, **장부 전체**에서 키워드를 찾는 검색을 제공한다.

**진입:** 년도 선택 행 우측 `Search` 아이콘 버튼 → 모달

```
┌──────────────────────────────────────────┐
│  장부 전체 검색                           │
│  [ 🔍  상품명, 주문번호, SKU …        ]   │
├──────────────────────────────────────────┤
│  [매입 · 상품매입]  2026-06-04           │
│  플레이브 피규어 A                        │
│  도매몰A                                  │
├──────────────────────────────────────────┤
│  [매출]  2026-06-04                      │
│  SO-260604-01                             │
│  샘플 상품 1                              │
└──────────────────────────────────────────┘
```

**결과 한 줄 구성**

| 영역 | 내용 |
|------|------|
| 뱃지 | `매입 · 상품매입` / `매출` / `수익` / `상품관리` |
| 날짜 | 해당 내역 날짜 (상품관리는 생략 가능) |
| 제목 | 상품명·주문번호·항목명 등 |
| 부제 | 구매처·SKU·비고 등 |

**결과 클릭 시 동작 (딥링크)**

URL 쿼리로 탭·월·검색어를 전달한다.

```
/ledger?tab=purchase&purchaseSub=product&month=2026-06&q=피규어
/ledger?tab=sale&month=2026-06&q=피규어
/ledger?tab=income&month=2026-06&q=네이버
/ledger?tab=products&q=SKU-001
```

1. 모달 닫힘
2. 해당 **메인 탭** 활성화 (매입이면 **서브탭**까지)
3. **월 탭** 해당 `YYYY-MM`으로 변경 (상품관리 제외)
4. 탭 내 검색 입력에 `q` 값 반영 → 목록 자동 필터

**URL 파라미터**

| 파라미터 | 설명 |
|----------|------|
| `tab` | `purchase` \| `sale` \| `income` \| `products` |
| `purchaseSub` | 매입일 때 `product` \| `supply` \| `other` |
| `month` | `YYYY-MM` |
| `q` | 탭 내 목록 검색어 (전역 검색·탭 검색 공통) |

**퍼블 데이터 범위 (현재)**

- 전역 검색 인덱스: 매입/매출/수익 **시드 데이터** + 상품관리 **localStorage**
- 탭에서 새로 등록·수정한 매입/매출/수익은 **세션 state**라 전역 검색에 즉시 반영되지 않을 수 있음
- 월 탭 선택은 URL에 반영되나, 목록 **월 필터 연동**은 추후 작업

**구현 파일**

- `components/ledger/ledger-global-search-dialog.tsx` — 모달·트리거
- `components/ledger/ledger-year-picker.tsx` — 우측 검색 버튼
- `lib/ledger-global-search.ts` — 검색 인덱스
- `hooks/use-ledger-url-search.ts` — 탭 내 `q` 동기화

---

### 탭 공통 구현 기준

```tsx
// /ledger 페이지
// - URL 쿼리로 탭 관리: ?tab=purchase|sale|income|products
// - URL 검색어: ?q= (탭 내 툴바와 동기화, 전역 검색 딥링크)
// - 매입 서브탭: ?purchaseSub=product|supply|other
// - 월: ?month=YYYY-MM
// - 탭 전환 시 URL 변경 (뒤로가기 가능)
// - 상품관리 탭 활성화 시 월선택 영역 숨김
// - 모든 목록은 table 태그 대신 div로 구현 (반응형 필수)
// - 검색 툴바 + 목록: LedgerListShell 한 카드
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

### 상품관리 탭 UI

월 필터 없음. 좌측 상품 목록 + 우측 상세 패널 2단 레이아웃.

**좌측 상품 카드**

```
┌────────────────────────────────────────────┐
│ [썸네일]  샘플 상품 1              [활성]   │
│          SKU SKU-001 · 안전 0 · 재고 12    │
│          · 기본가 25,000원                  │
└────────────────────────────────────────────┘
```

- 선택된 카드: `border-[var(--primary-500)]`
- 미선택: `border-[var(--color-border)]`, hover 시 primary border

**상태 뱃지 (목록 우측)**

우선순위: **비활성 → 품절 → 품절임박 → 활성**

| 뱃지 | 조건 | 스타일 |
|------|------|--------|
| 비활성 | `active === false` | `bg-[var(--primary-50)] text-[var(--color-text-muted)]` |
| 품절 | 활성 + 재고 ≤ 0 | `bg-red-50 text-[var(--color-danger)]` |
| 품절임박 | 활성 + 재고 > 0 이고 재고 ≤ 안전재고 | `bg-amber-50 text-amber-800` |
| 활성 | 활성 + 재고 > 안전재고 | `bg-emerald-50 text-emerald-700` |

- 비활성 상품은 재고와 무관하게 항상 **비활성** 표시
- 안전재고를 0으로 두면 재고 0일 때만 **품절**, 그 외 **활성** (품절임박 알림 없음)
- 품절임박 알림을 쓰려면 안전재고를 1 이상으로 설정

**우측 상세 — 히스토리 (재고·가격 통합)**

재고 이력 / 가격 변경 이력을 **히스토리** 하나로 시간순(최신순) 표시.

```
2026년 01월 03일 09:30                    ← text-xs, text-secondary
매입 +12개  개당 12,500원  총 150,000원  도매몰A     12개
```

- **재고 이벤트**
  - 유형: `매입` / `매출` / 수동조정 시 입력 **사유**
  - 수량: `+N개` 초록(`text-emerald-700`), `-N개` 빨강(`text-[var(--color-danger)]`)
  - 개당금액·총금액·구매처: 값이 있을 때만 표시
- **가격 이벤트**
  - 유형: `상품 등록` / `가격 수정` / `매입 반영` + 금액 + 사유(있을 때)
- **맨 우측**: 해당 시점 기준 **총 재고수** (`N개`, `text-secondary`)

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

## 투두리스트 (작업 진행 체크)

> 완료 시 `- [x]`, 미완료 시 `- [ ]` 로 갱신합니다. (`service-guide.md` 본문 구현은 별도 섹션)

### 0. 환경·초기화

- [x] 기존 `src` 퍼블 코드 초기화 후 새 구조로 재시작
- [x] `UI-guide.md` 디렉토리 구조 (`src/components`, `src/app`, `src/lib`, `src/types`)
- [ ] `.env.local` 작성 (`NEXT_PUBLIC_API_URL`, Supabase 키 등)
- [ ] `lib/auth-atoms.ts` (Jotai 로그인 상태)

### 1. 패키지·디자인 시스템

- [x] npm: framer-motion, jotai, `@tanstack/react-query`, `@tanstack/react-table`
- [x] npm: recharts, date-fns, axios, `@supabase/supabase-js`, exceljs
- [x] npm: `@fontsource/dm-sans`, lucide-react
- [x] shadcn/ui `init` + `components.json`
- [x] shadcn 컴포넌트: button, input, label, select, dialog, badge, card, tabs, sheet, tooltip, dropdown-menu, separator, skeleton
- [x] `globals.css` Sellog CSS Variables + shadcn 변수 병합
- [x] `app/providers.tsx` — Jotai + React Query + TooltipProvider
- [x] `app/layout.tsx` — DM Sans + Pretendard
- [ ] `components/common/loading-skeleton.tsx`

### 2. Cursor 작업 지시 순서 (퍼블 1차)

- [x] **1.** `globals.css` 디자인 시스템 세팅
- [x] **2.** `(main)/layout.tsx` — GNB(PC) + 하단 탭바(모바일)
- [ ] **2.** `(main)/layout.tsx` — 미로그인 시 `/login` 리다이렉트
- [x] **3.** `/login` — 좌측 남색 패널 + 우측 로그인 폼 (모바일: 폼만)
- [ ] **3.** `/login` — shadcn Input/Button, 에러 배너, 실제 인증 연동
- [x] **4.** `/dashboard` — 빈 화면 + "대시보드 준비 중입니다."
- [x] **5.** `/ledger` — 추이 섹션 + 월선택 + 탭(매입/매출/수익/상품관리) 껍데기
- [x] **5.** `/ledger` — 탭별 empty state (`?tab=purchase|sale|income|products`)
- [x] **5.** `/ledger` — 전역 검색 모달 (년도 행 우측) + `?q=` 탭 검색 연동
- [ ] **5.** `/ledger` — 추이 토글(전체/올해/이번달/주간/오늘) 동작
- [ ] **5.** `/ledger` — 기간 select(년/월/주) + 요약 카드 실데이터
- [ ] **5.** `/ledger` — 이전기간 대비 ▲▼ (전체 탭 제외)

### 3. 레이아웃·공통

- [x] GNB: 대시보드 / 장부 / 설정
- [x] 모바일 하단 탭바
- [x] `/` → `/dashboard` 리다이렉트
- [x] 장부 URL 탭: `?tab=purchase|sale|income|products`
- [x] 장부 URL 검색: `?q=` (전역 검색 딥링크 + 탭 내 툴바)
- [x] 상품관리 탭 시 월선택 영역 숨김 (UI만, 동작 확인)
- [ ] 목록 UI: `table` 대신 `div` 기반 (탭 본문부터 적용)
- [ ] shadcn 컴포넌트로 로그인·장부 헤더 리팩터 (현재 커스텀 div 위주)

### 4. 장부 탭 본문 (`service-guide.md` 연동)

- [ ] **매입** — 그룹 목록, 카드 라인, 그룹 하단 요약·액션, 재고반영 모달
- [ ] **매입** — 엑셀 업로드/다운로드, 페이지네이션
- [ ] **매출** — 채널 탭·관리, 주문 목록/토글, 등록 모달, 상태(취소/반품/교환)
- [ ] **수익** — 입금 목록, 등록/수정 모달, 엑셀 다운로드
- [ ] **상품관리** — 좌우 패널, SKU, 카테고리, 재고조정, 통합 히스토리, 상태 뱃지(활성/비활성/품절임박/품절)

### 5. API·상태 (추후)

- [ ] axios API 클라이언트 + React Query 훅
- [ ] Supabase 인증/DB 연동
- [ ] Framer Motion — 화면 전환·모달 애니메이션
- [ ] Recharts — 대시보드·장부 차트

---

*퍼블 가이드 v1 — 로그인/대시보드(빈화면)/장부 기본 구조*
*최종 수정: 2026-06-04 (전역 검색·URL q 연동)*