<<<<<<< HEAD
<<<<<<< HEAD
=======
# Sellog — BE API 연동 가이드

> **FE API 연동 기준** (2026-06). 서비스 로직 세부내용은 `service-guide.md` 참조.  
> 이 문서는 **각 화면·기능별 필요 API, 요청값, 응답값** 위주로 정리한다.  
> FE는 브라우저에서 `/api/v1` → Next.js rewrite로 BE 프록시 (`API_PROXY_TARGET`).

---

## 공통 규약

### Base URL

```
/api/v1
```

### 응답 포맷

```jsonc
// 성공
{ "data": <payload>, "meta": { "total": 120, "page": 1, "limit": 20 } }

// 에러
{ "error": { "code": "NOT_FOUND", "message": "..." } }
```

### 공통 쿼리 파라미터 (목록 API 공통)

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `q` | string | 검색어 (탭별 대상 필드는 하단 각 API 참조) |
| `month` | `YYYY-MM` | 월 필터 |
| `page` | number | 페이지 번호 (1-based, 기본 1) |
| `limit` | number | 페이지 크기 (기본 20) |

### 인증

- 보호 API: `Authorization: Bearer <accessToken>` 헤더 필요
- FE: accessToken은 쿠키 `sellog_token` + localStorage, refreshToken은 localStorage

| API | 설명 |
|-----|------|
| `POST /auth/login` | `{ email, password }` → `{ accessToken, refreshToken, user }` |
| `POST /auth/refresh` | `{ refreshToken }` → 토큰 로테이션 (동일 구조) |

로그아웃은 FE에서 세션 삭제만 수행 (별도 BE API 없음).

---

## 1. 장부 요약 (정산 추이 헤더)

> 화면: 장부 상단 정산 추이 카드 3개 + 하단 요약 문구

### `GET /ledger/summary`

**설명**: 장부 상단 정산 추이 카드 3개 + 하단 순손익 문구

| 파라미터 | 필수 | 값 |
|----------|------|-----|
| `period` | — | `all`(기본) \| `year` \| `month` \| `week` \| `today` |

**기간 필터 적용 대상**

| 필드 | 날짜 컬럼 | 범위 |
|------|-----------|------|
| `purchase.*` | `payment_date` | 상품매입 + 부가만 (기타지출 제외) |
| `sale.*` | `order_date` | `status = normal` 만 |
| `income.*` | `deposit_date` | 입금 전체 |

- `otherExpense.total`은 **`period`와 무관하게 항상 전체 누적**
- `netTotal` = `income.total`(선택 기간) − `otherExpense.total`(누적) — 서버 계산값 사용
- `week` = 이번 주 월요일(UTC) ~ 오늘

**응답**

```jsonc
{
  "data": {
    "period": "month",
    "purchase": {
      "productTotal": 192500,
      "supplyTotal": 40000,
      "total": 232500,
      "count": 4              // 상품+부가 라인 건수
    },
    "sale": {
      "normalTotal": 50000,
      "normalCount": 1
    },
    "income": {
      "total": 120000,
      "count": 1
    },
    "otherExpense": {
      "total": 660000
    },
    "netTotal": -540000
  }
}
```

### `GET /ledger/earliest-month`

**설명**: 연도·탭별 최초 데이터 월 → 월 탭 범위 (상품관리 탭은 미호출)

| 파라미터 | 필수 | 값 |
|----------|------|-----|
| `year` | ✓ | 2000~2100 |
| `tab` | ✓ | `purchase` \| `sale` \| `income` |

```jsonc
{
  "data": {
    "year": 2026,
    "tab": "purchase",
    "month": "2026-03"   // 해당 연도에 데이터 없으면 null
  }
}
```

| `tab` | 날짜 기준 |
|-------|-----------|
| `purchase` | 상품매입 + 부가 + 기타 `payment_date` 중 가장 이른 월 |
| `sale` | `sale_orders.order_date` |
| `income` | `income_lines.deposit_date` |

---

## 2. 전역 검색

> **화면**: 장부 헤더(연도·월 선택 영역) 우측 검색 아이콘 → `장부 전체 검색` 모달  
> **FE 연동 상태**: **미연동** — `src/lib/ledger-global-search.ts`가 퍼블 시드(`*-pub-seed.ts`) + localStorage 상품만 검색.  
> **목표**: 아래 API 구현 후 FE가 시드 검색을 제거하고 본 API로 교체.

### 2-1. FE 현행 동작 (BE 구현 시 맞출 기준)

| 항목 | FE 구현 |
|------|---------|
| 진입점 | `LedgerGlobalSearchTrigger` (`ledger-year-picker.tsx`) |
| UI | `ledger-global-search-dialog.tsx` — 입력 즉시 검색, 스크롤 목록 |
| 검색 호출 | 클라이언트 `searchLedgerGlobally(query)` (동기, API 없음) |
| 빈 검색어 | `[]` 반환 (API 호출 안 함) |
| 결과 선택 시 URL | `tab`, `purchaseSub`(매입만), `month`(YYYY-MM), `q`(검색어) 설정 후 해당 탭 이동 |
| 탭 내 검색 | 이동 후 각 탭 `useLedgerUrlSearch` → `committedSearch`로 **기존 목록 API** `q` 재사용 |

**FE 구현 파일**

- `src/components/ledger/ledger-global-search-dialog.tsx`
- `src/lib/ledger-global-search.ts`
- `src/types/ledger-global-search.ts`
- `src/hooks/use-ledger-url-search.ts`

**제거 예정 (API 연동 후)**

- `src/lib/income-pub-seed.ts`
- `src/lib/sale-pub-seed.ts`
- `src/lib/purchase-pub-seed.ts` (전역 검색용 시드 부분)

---

### 2-2. API — `GET /ledger/search`

장부 4개 탭(매입 3종·매출·수익·상품관리)을 **한 번에** 검색해 모달용 **요약 카드** 목록을 반환한다.  
상세 필드·금액·페이징 목록은 기존 탭별 API를 그대로 사용한다.

| 파라미터 | 필수 | 기본값 | 설명 |
|----------|------|--------|------|
| `q` | ✓ | — | 검색어. trim 후 빈 문자열이면 `400` 또는 `data: []` |
| `page` | — | `1` | 1-based |
| `limit` | — | `30` | 모달 1페이지 권장 30~50 |

**인증**: 로그인 사용자 본인 데이터만 (다른 탭 목록 API와 동일 스코프).

---

### 2-3. 검색 대상 (FE `ledger-global-search.ts`와 1:1)

각 행은 **매칭된 엔티티 1건 = 결과 1건**. 부분 일치·대소문자 무시(`ILIKE` / `LOWER` 비교 권장).

| `tab` | `purchaseSub` | 원본 테이블·단위 | `q` 매칭 필드 | `date` / `month` 기준 |
|-------|---------------|------------------|---------------|------------------------|
| `purchase` | `product` | 상품매입 **라인** | `product_name`, `vendor`(스냅샷명), `order_no`, `memo`, **그룹 `group_name`**, `payment_date` 문자열 | `payment_date` |
| `purchase` | `supply` | 부가 **라인** | `item_name`, `vendor`, `memo`, `payment_date` | `payment_date` |
| `purchase` | `other` | 기타지출 **라인** | `item_name`, `memo`, `payment_date` | `payment_date` |
| `sale` | — | 매출 **주문** 1건 | `order_no`, `customer_name`, **주문 항목 `product_name` 전체**(OR), `memo`, `order_date` | `order_date` |
| `income` | — | 수익 **입금 라인** | `item_name`, `memo`, `deposit_date` | `deposit_date` |
| `products` | — | 상품 **1건** | `name`, `sku`, `memo`, `category` | 없음 (`month`·`date` 생략) |

**탭별 목록 API `q`와 정합성**

- 상품매입: §3 `GET /purchase/products` — 그룹명·상품명·구매처·주문번호·비고
- 부가: §4 `GET /purchase/supply` — 항목명·구매처·비고
- 기타: §5 `GET /purchase/other` — 항목명·비고
- 매출: §6 `GET /sales` — 주문번호·주문자명·상품명·비고
- 수익: §7 `GET /income` — 항목명·비고
- 상품: §8 `GET /products` — 상품명·SKU·메모·카테고리

전역 검색은 위와 동일 범위 + **날짜 문자열 부분 일치**(`2026-06`, `06-04` 등)만 추가.

**제외**

- soft delete·비활성 정책은 각 도메인 목록 API와 동일
- 매출 `status=cancelled` 주문: 탭 기본 목록과 동일하게 포함 여부 결정 (권장: **포함**, FE 시드도 구분 없음)
- 상품매입 그룹 메타(추가금·할인) 텍스트는 검색 대상 **아님** (FE 동일)

---

### 2-4. 응답 — 결과 항목 스키마

```jsonc
{
  "data": [
    {
      "id": "purchase-product-pp-001",   // 목록 내 유일. 권장: "{tab}-{purchaseSub?}-{entityId}"
      "tab": "purchase",                 // purchase | sale | income | products
      "purchaseSub": "product",          // tab=purchase 일 때만. product | supply | other
      "entityId": "pp-001",              // 원본 PK (P2: 행 포커스용, FE 미사용)
      "month": "2026-06",                // YYYY-MM. products 탭은 생략 또는 null
      "title": "플레이브 피규어 A",
      "subtitle": "도매몰A",             // 없으면 생략
      "date": "2026-06-04"               // ISO date. products 탭은 생략 또는 null
    }
  ],
  "meta": { "total": 12, "page": 1, "limit": 30 }
}
```

**`title` / `subtitle` / `date` 채우기 규칙** (FE 표시·정렬과 동일하게)

| 구분 | `title` | `subtitle` | `date` |
|------|---------|------------|--------|
| 상품매입 라인 | `product_name` | `vendor` 스냅샷명 (없으면 생략) | `payment_date` |
| 부가 라인 | `item_name` | `vendor` | `payment_date` |
| 기타지출 라인 | `item_name` | `memo` (없으면 생략) | `payment_date` |
| 매출 주문 | `order_no` 없으면 `customer_name` | 주문 항목 `product_name`을 공백으로 이어 붙임 | `order_date` |
| 수익 라인 | `item_name` | `memo` (없으면 생략) | `deposit_date` |
| 상품 | `name` | `"SKU " + sku` | 생략 |

**`tabLabel` / `subLabel`**

- FE가 클라이언트에서 한글 매핑 중 (`매입`·`상품매입` 등). **BE 응답 필수 아님**.
- 내려줘도 FE는 무시하거나 덮어쓸 수 있음.

**정렬** (전체 병합 후 1회)

1. `date` 있는 항목: `date` **내림차순** (최신 우선)
2. `date` 없음(상품): 같은 그룹 내에서 `title` **오름차순** (`ko` 로케일)
3. `date` 동일 시 `title` 오름차순

> FE `searchLedgerGlobally` 정렬 로직과 동일. DB에서 탭별로 정렬 후 merge sort 하거나, 앱 레이어에서 통합 정렬.

---

### 2-5. 응답 예시

```jsonc
// GET /ledger/search?q=플레이브&page=1&limit=30
{
  "data": [
    {
      "id": "purchase-product-pp-001",
      "tab": "purchase",
      "purchaseSub": "product",
      "entityId": "pp-001",
      "month": "2026-06",
      "title": "플레이브 피규어 A",
      "subtitle": "도매몰A",
      "date": "2026-06-04"
    },
    {
      "id": "sale-so-002",
      "tab": "sale",
      "entityId": "so-002",
      "month": "2026-05",
      "title": "SO-260501-02",
      "subtitle": "플레이브 피규어 A 플레이브 피규어 B",
      "date": "2026-05-28"
    },
    {
      "id": "products-prd-010",
      "tab": "products",
      "entityId": "prd-010",
      "title": "플레이브 굿즈 세트",
      "subtitle": "SKU PLV-010"
    }
  ],
  "meta": { "total": 3, "page": 1, "limit": 30 }
}
```

---

### 2-6. BE 구현 가이드

**권장 구조**

1. `q` 정규화: `trim`, 연속 공백 1칸, 빈 값 거부
2. 탭별 쿼리 6개 병렬 실행 (각 `LIMIT`은 `(page-1)*limit ~ page*limit`보다 넉넉히 — 예: `limit * 2`)  
   또는 DB `UNION ALL` + 윈도우 함수로 통합 페이징
3. 매칭 건을 공통 DTO로 매핑 후 §2-4 정렬
4. `meta.total` = 6개 소스 **매칭 건수 합** (중복 제거 없음 — 엔티티당 1행)

**성능**

- 인덱스: 각 테이블 `user_id` + 검색 텍스트 컬럼(`gin_trgm` 등) + 날짜 컬럼
- `q` 최소 길이 제한 없음 (FE 동일). 과부하 시 BE에서 `q.length < 2` → `[]` 정책 가능 (FE에 사전 공지)

**에러**

| 상황 | code |
|------|------|
| 미인증 | `UNAUTHORIZED` |
| `q` 누락 | `VALIDATION_ERROR` |

---

### 2-7. FE 연동 계획 (BE 완료 후)

1. `src/lib/api/ledger-search.ts` — `fetchLedgerSearch(q, page?, limit?)`
2. `ledger-global-search-dialog.tsx` — `useQuery` + debounce(300ms), `searchLedgerGlobally` 제거
3. 응답 → `LedgerGlobalSearchResult` 매핑 (`tabLabel`/`subLabel`은 FE 상수로 부여)
4. `*-pub-seed.ts` 전역 검색 참조 제거

**결과 클릭 시 URL** (변경 없음)

```
/ledger?tab=purchase&purchaseSub=product&month=2026-06&q=플레이브
/ledger?tab=products&q=SKU-001
```

---

### 2-8. 추후 확장 (P2, FE·BE 공동)

| 항목 | 설명 |
|------|------|
| `focusId` / `lineId` | 결과 선택 시 해당 **행** 스크롤·하이라이트 (`entityId` 활용) |
| 무한 스크롤 | 모달에서 `page` 증가 로드 |
| 하이라이트 스니펫 | `title` 내 매칭 구간 `<mark>` (선택) |

---

## 3. 매입 — 상품매입

> 화면: 장부 > 매입 > 상품매입 탭

### 3-1. 목록 조회

**`GET /purchase/products`**

| 쿼리 | 설명 |
|------|------|
| `q` | 그룹명, 상품명, 구매처, 주문번호, 비고 검색 |
| `month` | 결제날짜 월 필터 (`YYYY-MM`) |
| `page` / `limit` | 페이지 |

**응답**: 날짜 기준 그룹 묶음

```jsonc
{
  "data": [
    {
      "paymentDate": "2026-06-04",
      "groupMeta": {
        "groupName": "매입1",
        "extraFees": [{ "id": "adj-1", "label": "배송비", "amount": 3500 }],
        "discounts": [],
        "orderCancelled": false
      },
      "lines": [
        {
          "id": "pp-001",
          "paymentDate": "2026-06-04",
          "orderNo": "NV-240501-01",
          "imageUrl": "https://...",   // 상품 이미지 URL (S3 등)
          "productName": "플레이브 피규어 A",
          "productLink": "https://...",
          "vendor": "도매몰A",
          "quantity": 10,
          "paymentAmount": 150000,
          "memo": "1차 입고",
          "bankId": "bank-001",        // null 가능
          "bank": {                    // 스냅샷, bankId 있을 때
            "id": "bank-001",
            "bankName": "국민은행",
            "accountNumber": "1234567890",
            "accountHolder": "홍길동"
          },
          "stockReflected": false,
          "productSku": null           // 재고반영 전 null
        }
      ]
    }
  ],
  "meta": { "total": 2, "page": 1, "limit": 20 }
}
```

---

### 3-2. 라인 등록

**`POST /purchase/products`**

```jsonc
{
  "paymentDate": "2026-06-04",
  "orderNo": "NV-240501-01",       // 선택
  "imageUrl": "https://...",        // 선택
  "productName": "플레이브 피규어 A",
  "productLink": "https://...",     // 선택
  "vendor": "도매몰A",
  "quantity": 10,
  "paymentAmount": 150000,
  "memo": "1차 입고",               // 선택
  "bankId": "bank-001"              // 선택, null 가능
}
```

**응답**: 생성된 `ProductPurchaseLine` 객체 (`bank` 스냅샷 포함 가능)

---

### 3-3. 라인 수정

**`PATCH /purchase/products/:id`**

```jsonc
{
  "paymentDate": "2026-06-04",
  "orderNo": "NV-240501-01",
  "imageUrl": "https://...",
  "productName": "플레이브 피규어 A",
  "productLink": "https://...",
  "vendor": "도매몰A",
  "quantity": 10,
  "paymentAmount": 150000,
  "memo": ""
}
```

> **제약**: `stockReflected: true` 라인은 수정 불가 처리 권장 (또는 FE에서 차단)  
> **응답**: 금액·수량 변경 시 `previousPaymentAmount`, `previousQuantity`, `unitPrice`, `previousUnitPrice` 포함 — **§15-3**

---

### 3-4. 라인 삭제

**`DELETE /purchase/products/:id`**

> **제약**: `stockReflected: true` 이면 `409 Conflict` 반환

---

### 3-5. 재고반영 확정

**`POST /purchase/products/:id/stock-reflect`**

```jsonc
{
  "productSku": "SKU-001",   // 상품관리의 SKU (= 상품 고유 ID)
  "qty": 10                  // 반영 수량 (구매 수량과 다를 수 있음)
}
```

**BE 처리 내용**:
1. `purchase_product_lines.stockReflected = true`, `productSku` 저장
2. 해당 SKU 상품의 `stock += qty`
3. `stock_history` 항목 추가 (source: `purchase`, vendor·orderNo·unitPrice·totalAmount 포함)
4. 반영 단가(`paymentAmount ÷ qty`) ≠ 현재 `currentPrice` 이면 가격 갱신 + `price_history` 추가

**응답**

```jsonc
{
  "data": {
    "line": { /* 갱신된 ProductPurchaseLine */ },
    "product": { /* 갱신된 InventoryProduct */ }
  }
}
```

---

### 3-6. 재고반영 취소

**`DELETE /purchase/products/:id/stock-reflect`**

**제약**:
- 해당 반영분으로 **이미 판매(재고 차감)된 수량이 있으면** `409 Conflict`  
  (예: `"판매 내역이 있어 재고반영 취소가 불가합니다."`)
- `currentPrice` / `price_history`는 **되돌리지 않음** (가격은 유지)

**BE 처리 내용**:
1. `stockReflected = false`, `productSku = null`
2. 해당 SKU 상품의 `stock -= qty` (반영 당시 qty 기준)
3. `stock_history` 역분개 항목 추가

부가(`DELETE /purchase/supply/:id/stock-reflect`)도 동일 패턴. 판매 연동 가드는 BE 정책에 따름.

---

### 3-7. 그룹 메타 저장 (그룹명·추가금·할인)

**`PATCH /purchase/groups`**

```jsonc
{
  "paymentDate": "2026-06-04",   // 그룹 식별자
  "groupName": "매입1",
  "extraFees": [
    { "id": "adj-1", "label": "배송비", "amount": 3500 }
  ],
  "discounts": []
}
```

---

### 3-8. 그룹 주문취소 토글

**`PATCH /purchase/groups/cancel`**

```jsonc
{
  "paymentDate": "2026-06-04",
  "orderCancelled": true         // true = 취소 처리
}
```

---

## 4. 매입 — 부가 (공급비용)

> 화면: 장부 > 매입 > 부가 탭

### 4-1. 목록 조회

**`GET /purchase/supply`**

| 쿼리 | 설명 |
|------|------|
| `q` | 항목명, 구매처, 비고 검색 |
| `month` | 결제날짜 월 필터 |
| `page` / `limit` | |

**응답**

```jsonc
{
  "data": [
    {
      "paymentDate": "2026-06-04",
      "lines": [
        {
          "id": "se-001",
          "paymentDate": "2026-06-04",
          "itemName": "골판지 박스 (중)",
          "vendor": "포장재마트",
          "quantity": 100,
          "paymentAmount": 28000,
          "memo": "",
          "bankId": null,
          "bank": null,
          "stockReflected": false,
          "productSku": null
        }
      ]
    }
  ]
}
```

---

### 4-2. 라인 등록

**`POST /purchase/supply`**

```jsonc
{
  "paymentDate": "2026-06-04",
  "itemName": "골판지 박스 (중)",
  "vendor": "포장재마트",     // 선택
  "quantity": 100,
  "paymentAmount": 28000,
  "memo": "",
  "bankId": "bank-001"              // 선택
}
```

---

### 4-3. 라인 수정

**`PATCH /purchase/supply/:id`**

> `stockReflected: true` 라인 수정 불가

---

### 4-4. 라인 삭제

**`DELETE /purchase/supply/:id`**

> `stockReflected: true` 이면 `409` 반환

---

### 4-5. 재고반영 (부가)

**`POST /purchase/supply/:id/stock-reflect`**

```jsonc
{
  "productSku": "PKG-001",
  "qty": 100
}
```

**BE 처리 내용**: 상품 stock 증가 + stockHistory 추가 (가격 갱신 미적용)

---

### 4-6. 재고반영 취소 (부가)

**`DELETE /purchase/supply/:id/stock-reflect`**

---

## 5. 매입 — 기타지출

> 화면: 장부 > 매입 > 기타지출 탭

### 5-1. 목록 조회

**`GET /purchase/other`**

| 쿼리 | 설명 |
|------|------|
| `q` | 항목명, 비고 검색 |
| `month` | 결제날짜 월 필터 |

**응답**

```jsonc
{
  "data": [
    {
      "paymentDate": "2026-06-04",
      "lines": [
        {
          "id": "oe-001",
          "paymentDate": "2026-06-04",
          "itemName": "사무실 월세",
          "paymentAmount": 550000,
          "memo": "5월분",
          "bankId": null,
          "bank": null
        }
      ]
    }
  ]
}
```

---

### 5-2. 라인 등록

**`POST /purchase/other`**

```jsonc
{
  "paymentDate": "2026-06-04",
  "itemName": "사무실 월세",
  "paymentAmount": 550000,
  "memo": "5월분",
  "bankId": "bank-001"              // 선택
}
```

---

### 5-3. 라인 수정 / 삭제

- **`PATCH /purchase/other/:id`** — 등록과 동일 필드
- **`DELETE /purchase/other/:id`**

---

## 6. 매출

> 화면: 장부 > 매출 탭

### 6-1. 목록 조회

**`GET /sales`**

| 쿼리 | 설명 |
|------|------|
| `q` | 주문번호, 주문자명, 상품명, 비고 검색 |
| `month` | 주문일 월 필터 |
| `status` | `normal` \| `cancelled` (선택, 미지정 시 전체) |
| `page` / `limit` | |

**응답**

```jsonc
{
  "data": [
    {
      "id": "so-001",
      "orderDate": "2026-06-04",
      "orderNo": "SO-260604-01",
      "customerName": "김민수",
      "channelId": "ch-001",         // null 가능
      "channel": {
        "id": "ch-001",
        "name": "스마트스토어",
        "platformFeeRate": 0.0636,
        "storeName": "OO피규어",
        "storeUrl": "https://smartstore.naver.com/oo-figure"
      },
      "items": [
        {
          "productId": "prd-001",
          "productSku": "SKU-001",
          "productName": "샘플 상품 1",
          "quantity": 2,
          "lineAmount": 50000
        }
      ],
      "extraAdjustments": [
        { "id": "adj-1", "label": "배송비", "amount": 3000 }
      ],
      "discountAdjustments": [
        { "id": "adj-2", "label": "쿠폰", "amount": 1000 }
      ],
      "extraAmount": 3000,
      "discountAmount": 1000,
      "totalAmount": 52000,
      "memo": "",
      "status": "normal"
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "todayTotal": 52000,           // 오늘 정상 주문 합계 (상단 요약용)
    "monthTotal": 120000           // 이번달 정상 주문 합계
  }
}
```

---

### 6-2. 매출 등록

**`POST /sales`**

```jsonc
{
  "orderDate": "2026-06-04",
  "orderNo": "SO-260604-01",
  "customerName": "김민수",
  "channelId": "ch-001",           // 선택
  "items": [
    {
      "productId": "prd-001",
      "quantity": 2,
      "lineAmount": 50000
    }
  ],
  "extraAdjustments": [
    { "label": "배송비", "amount": 3000 }
  ],
  "discountAdjustments": [],
  "memo": ""
}
```

**BE 처리 내용**:
1. `totalAmount` 계산: `items 합 + extraAdjustments 합 - discountAdjustments 합`
2. 각 `productId` 상품 `stock` 차감 (재고 부족 시 `409` 반환)
3. 상품별 `stock_history` 추가 (source: `sale`, orderNo·채널명 등 포함)
4. 응답에 스냅샷(`productSku`, `productName`) 포함

**응답**: 생성된 `SaleOrder` 전체 (스냅샷 포함)

---

### 6-3. 매출 수정

**`PATCH /sales/:id`**

> `status: "cancelled"` 주문은 수정 불가 (`403` 반환)

```jsonc
// 요청: 등록과 동일 구조
```

**BE 처리 내용**:
1. 기존 재고 차감분 복구
2. 새 재고 차감 (부족 시 `409`)
3. stockHistory 갱신

---

### 6-4. 주문 취소 / 취소해제

**`PATCH /sales/:id/cancel`**

```jsonc
{ "cancel": true }   // true=취소처리, false=취소해제
```

**BE 처리 내용**:
- `cancel: true`: `status = "cancelled"`, 재고 복구 + stockHistory
- `cancel: false`: `status = "normal"`, 재고 재차감 (부족 시 `409`)

---

### 6-5. 매출 삭제

**`DELETE /sales/:id`**

> `status: "normal"` 주문 삭제 불가 (`409` 반환)  
> `status: "cancelled"` 주문만 삭제 허용 (재고는 취소처리 시 이미 복구됨)

---

## 7. 수익 (입금 기록)

> 화면: 장부 > 수익 탭

### 7-1. 목록 조회

**`GET /income`**

| 쿼리 | 설명 |
|------|------|
| `q` | 항목명, 비고 검색 |
| `month` | 입금일 월 필터 |
| `page` / `limit` | |

**응답**

```jsonc
{
  "data": [
    {
      "depositDate": "2026-06-04",
      "lines": [
        {
          "id": "inc-001",
          "depositDate": "2026-06-04",
          "itemName": "네이버 정산",
          "amount": 120000,
          "vatAmount": 10000,          // null 가능
          "commissionAmount": 5000,    // null 가능
          "memo": "",
          "bankId": "bank-001",        // 입금계좌, null 가능
          "bank": {
            "id": "bank-001",
            "bankName": "국민은행",
            "accountNumber": "1234567890",
            "accountHolder": "홍길동"
          }
        }
      ]
    }
  ],
  "meta": {
    "total": 3,
    "page": 1,
    "limit": 20,
    "todayTotal": 120000,             // 오늘 입금 합계 (상단 요약용)
    "monthTotal": 350000              // 이번달 입금 합계
  }
}
```

---

### 7-2. 입금 등록

**`POST /income`**

```jsonc
{
  "depositDate": "2026-06-04",
  "itemName": "네이버 정산",
  "amount": 120000,
  "vatAmount": 10000,                // 선택
  "commissionAmount": 5000,          // 선택
  "memo": "",
  "bankId": "bank-001"               // 선택 (입금계좌)
}
```

> 부가세·수수료는 입력·저장만 되며, 상단 집계·순수익 UI 반영은 2차 예정.

---

### 7-3. 입금 수정

**`PATCH /income/:id`**

> 등록과 동일 필드

---

### 7-4. 입금 삭제

**`DELETE /income/:id`**

---

## 8. 상품관리

> 화면: 장부 > 상품관리 탭 (월 필터 없음, 전체 기준)

### 8-1. 상품 목록 조회

**`GET /products`**

| 쿼리 | 설명 |
|------|------|
| `q` | 상품명, SKU, 메모, 카테고리 검색 |
| `active` | `true` \| `false` (선택, 미지정 시 전체) |
| `page` / `limit` | |

**응답**

```jsonc
{
  "data": [
    {
      "id": "prd-001",
      "sku": "SKU-001",
      "name": "샘플 상품 1",
      "category": "완구",
      "imageUrl": "https://...",
      "memo": "",
      "active": true,
      "stock": 10,
      "safetyStock": 3,
      "currentPrice": 25000,
      "createdAtIso": "2026-01-01T00:00:00Z",
      "updatedAtIso": "2026-06-04T12:00:00Z"
      // stockHistory, priceHistory는 상세 API에서 별도 조회
    }
  ],
  "meta": { "total": 5, "page": 1, "limit": 20 }
}
```

---

### 8-2. 상품 상세 조회

**`GET /products/:id`**

**응답**: 목록과 동일 필드 (재고·가격 **이력은 별도 API**)

```jsonc
{
  "data": {
    "id": "prd-001",
    "sku": "SKU-001",
    "name": "샘플 상품 1",
    "category": "완구",
    "imageUrl": "https://...",
    "memo": "",
    "active": true,
    "stock": 10,
    "safetyStock": 3,
    "currentPrice": 25000,
    "createdAtIso": "2026-01-01T00:00:00Z",
    "updatedAtIso": "2026-06-04T12:00:00Z"
  }
}
```

---

### 8-2-1. 재고 이력

**`GET /products/:id/stock-history`**

| 쿼리 | 설명 |
|------|------|
| `page` / `limit` | 페이지 (FE 기본 limit 20) |
| `date` | 이력 발생월 `YYYY-MM` (선택) |
| `kind` | `purchase` \| `sale` — 미지정 시 전체 재고 이력 |

> FE 히스토리 탭: `전체`는 stock + price API 병렬 조회 후 통합 정렬, `가격수정`은 price-history만, `매입`/`판매`는 stock-history에 `kind` 전달.

**응답 항목 예시**

```jsonc
{
  "id": "stk-001",
  "atIso": "2026-06-04T12:00:00Z",
  "delta": 10,
  "source": "purchase",              // purchase | sale | manual_adjust
  "vendor": "도매몰A",
  "orderNo": "NV-240501-01",
  "unitPrice": 15000,
  "totalAmount": 150000,
  "reason": "매입 재고반영 (플레이브 피규어 A)"
}
```

---

### 8-2-2. 가격 이력

**`GET /products/:id/price-history`**

| 쿼리 | 설명 |
|------|------|
| `page` / `limit` | |
| `date` | `YYYY-MM` (선택) |
| `kind` | `price_edit` 등 (BE 스펙에 따름) |

**응답 항목 예시**

```jsonc
{
  "id": "prh-001",
  "atIso": "2026-06-04T12:00:00Z",
  "price": 15000,
  "source": "purchase",              // product_register | manual_edit | purchase
  "reason": "매입 반영 (도매몰A)"
}
```

---

### 8-3. 상품 등록

**`POST /products`**

```jsonc
{
  "sku": "SKU-001",
  "name": "샘플 상품 1",
  "category": "완구",               // 선택 (카테고리 name 또는 id)
  "imageUrl": "https://...",        // 선택
  "memo": "",
  "active": true,
  "stock": 0,                       // 초기 재고
  "safetyStock": 3,
  "currentPrice": 25000
}
```

**BE 처리**: 초기 재고 > 0이면 stockHistory 첫 항목 자동 생성 (source: `product_register`)

---

### 8-4. 상품 수정

**`PATCH /products/:id`**

```jsonc
{
  "name": "샘플 상품 1 (수정)",
  "category": "완구",
  "imageUrl": "https://...",
  "memo": "",
  "active": true,
  "safetyStock": 3,
  "currentPrice": 28000            // 이전 값과 다르면 priceHistory 자동 추가
}
```

> `sku`는 수정 불가 (변경 시 `400` 반환 권장)  
> 가격 변경 시 응답에 `previousPrice`, (선택) `priceAmendedAtIso` 포함 — **§15-2**

---

### 8-5. 상품 삭제 (soft delete)

**`DELETE /products/:id`**

> 재고(`stock`) > 0 이면 `409` 반환  
> 삭제 시 `deletedAtIso` 설정, 이후 목록 조회에서 제외

---

### 8-6. 재고 수동조정

**`POST /products/:id/stock-adjust`**

```jsonc
{
  "action": "increase",     // increase | decrease
  "quantity": 5,
  "reason": "실사 조정"    // 선택
}
```

**BE 처리**: `stock` 갱신 + `stockHistory` 추가 (source: `manual_adjust`)

---

## 9. 출금·입금 계좌

> 화면: 매입(상품·부가·기타) 출금계좌, 수익 입금계좌 — 동일 `/banks` API

| API | 설명 |
|-----|------|
| `GET /banks` | 목록 (soft delete 제외) |
| `POST /banks` | `{ bankName, accountNumber, accountHolder }` |
| `PATCH /banks/:id` | 동일 필드 수정 |
| `DELETE /banks/:id` | soft delete |

매입·수익 라인에는 `bankId` + 등록 시점 `bank` 스냅샷 저장. 계좌 삭제 후에도 스냅샷으로 목록 표시 가능.

---

## 10. 판매채널

> 화면: 매출 등록 — 채널 선택·관리 (`sale-channel-manage-dialog`)

### 10-1. 현재 (FE 연동됨)

| API | 설명 |
|-----|------|
| `GET /sales-channels` | 목록 (soft delete 제외) |
| `POST /sales-channels` | `{ name }` |
| `PATCH /sales-channels/:id` | `{ name }` |
| `DELETE /sales-channels/:id` | soft delete |

매출 주문: `channelId` + `channel` 스냅샷 (`{ id, name }`).

---

### 10-2. 확장 요청 (BE 구현 필요) — §14-10

> **배경**: 채널마다 플랫폼 수수료가 다름(스마트스토어·쿠팡·G마켓 등). 부가세(10/110)는 채널과 무관 → **전역 설정**(`GET /settings`)에만 둠. **수수료는 채널별**로 관리.

**필드 정의**

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `name` | string | ✓ | 채널 라벨 — 매출 뱃지·선택 목록 (예: `스마트스토어`, `쿠팡`) |
| `platformFeeRate` | number | ✓ | 추정 순익용 플랫폼 수수료율 (0~1). 예: `0.0636` = 6.36% |
| `storeName` | string | — | 해당 채널 **내 상점명** (예: `OO피규어`). `name`과 구분 |
| `storeUrl` | string | — | 스토어·셀러센터 URL (http/https) |

**`GET /sales-channels` 응답 예시**

```jsonc
{
  "data": [
    {
      "id": "ch-001",
      "name": "스마트스토어",
      "platformFeeRate": 0.0636,
      "storeName": "OO피규어",
      "storeUrl": "https://smartstore.naver.com/oo-figure",
      "createdAtIso": "2026-01-01T00:00:00Z",
      "updatedAtIso": "2026-06-04T12:00:00Z"
    }
  ]
}
```

**`POST /sales-channels` / `PATCH /sales-channels/:id` body**

```jsonc
{
  "name": "쿠팡",
  "platformFeeRate": 0.108,
  "storeName": "OO피규어",
  "storeUrl": "https://www.coupang.com/..."
}
```

**검증**

- `name`: trim 후 비어 있으면 `400`
- `platformFeeRate`: `0 <= rate <= 0.2` 권장 (20% 초과 시 경고 또는 상한 정의)
- `storeUrl`: http/https URL 형식, 빈 문자열 → null
- soft delete된 채널은 목록·선택에서 제외 (기존과 동일)

**매출 주문 스냅샷 확장**

등록·수정 시점 채널 정보를 스냅샷으로 저장 (채널 마스터 변경·삭제 후에도 주문 이력 유지).

```jsonc
// GET /sales 응답 — channel 스냅샷
{
  "channelId": "ch-001",
  "channel": {
    "id": "ch-001",
    "name": "스마트스토어",
    "platformFeeRate": 0.0636,
    "storeName": "OO피규어",
    "storeUrl": "https://smartstore.naver.com/oo-figure"
  }
}
```

> `SalesChannelSummary` 타입: `id`, `name`, `platformFeeRate`, `storeName?`, `storeUrl?`

**추정 순익(`marginEstimate`) 연동**

| 조건 | 수수료율 출처 |
|------|----------------|
| `channelId` 있고 채널에 `platformFeeRate` 있음 | 해당 채널 `platformFeeRate` |
| `channelId` 없음 | `GET /settings` → `defaultPlatformFeeRate` (fallback, 선택) |
| 둘 다 없음 | BE 기본값 `0.0636` (하드코딩 fallback, 문서화) |

```jsonc
// marginEstimate.assumptions 예시
{
  "vatNote": "포함가 × 10/110",
  "platformFeeNote": "결제금액 × 6.36% (스마트스토어 · OO피규어)"
}
```

- `estimatedPlatformFeeAmount` = `totalAmount × platformFeeRate` (주문 시점 스냅샷 rate 사용 권장)
- `estimatedVatAmount` = `totalAmount × vatExtractRate` — **`GET /settings.vatExtractRate`** (채널 무관)

**FE 연동 (BE 배포 후)**

- 채널 관리 모달: 등록·수정 폼에 수수료(% 입력 → 소수 저장), 상점명, URL
- 목록: `name · 6.36%` 요약 표시, `storeUrl` 있으면 링크 아이콘
- §14-2 설정: 전역 `platformFeeRate` **제거** → 채널별로 이전

**마이그레이션 (기존 데이터)**

- 기존 `name`만 있는 채널 → `platformFeeRate: 0.0636` 기본값 backfill
- `storeName`, `storeUrl` → null

**추후 (P3, 지금 불필요)**

- `code`: `smartstore` \| `coupang` \| … (API 연동용)
- `externalStoreId`: 플랫폼 측 상점 ID

---

## 11. 이미지 업로드

> 화면: 상품매입 등록 — 상품 이미지

**`POST /upload`**

- `multipart/form-data`, 필드명 `file`
- 이미지만 (FE 클라이언트 검증: 10MB 이하)
- 응답 `data.url`을 매입 `imageUrl`·상품 `imageUrl`에 사용 (R2 등 객체 스토리지)

```jsonc
{
  "data": {
    "url": "https://...",
    "key": "products/...",
    "contentType": "image/jpeg",
    "size": 12345
  }
}
```

---

## 12. 카테고리 관리

> 화면: 상품 등록/편집 모달 내 카테고리 선택 → 관리 모달

### 12-1. 카테고리 목록

**`GET /categories`**

> soft delete된 항목 (`deletedAtIso != null`) 제외

**응답**

```jsonc
{
  "data": [
    { "id": "cat-001", "name": "완구", "createdAtIso": "...", "updatedAtIso": "..." }
  ]
}
```

---

### 12-2. 카테고리 등록

**`POST /categories`**

```jsonc
{ "name": "완구" }
```

---

### 12-3. 카테고리 수정

**`PATCH /categories/:id`**

```jsonc
{ "name": "완구(수정)" }
```

---

### 12-4. 카테고리 삭제

**`DELETE /categories/:id`**

> soft delete (`deletedAtIso` 설정)  
> 해당 카테고리를 사용 중인 상품의 category 필드는 유지 (이력 보존)

---

## 부록 A. 주요 필드 타입 정리

| 필드명 | 타입 | 비고 |
|--------|------|------|
| `id` | `string` | UUID 권장 |
| `*Date` / `*Iso` | `string` | `YYYY-MM-DD` 또는 ISO 8601 |
| `amount` / `paymentAmount` / `totalAmount` | `number` | 원(KRW), 정수 |
| `stock` / `quantity` | `number` | 정수 |
| `delta` | `number` | 재고이력, 양수=증가 / 음수=감소 |
| `status` | `"normal"` \| `"cancelled"` | 매출 주문 상태 |
| `source` (stockHistory) | `"purchase"` \| `"sale"` \| `"manual_adjust"` | |
| `source` (priceHistory) | `"product_register"` \| `"manual_edit"` \| `"purchase"` | |
| `channelId` | `string?` | 매출 판매채널 FK |
| `channel` | `SalesChannelSummary?` | 등록 시점 스냅샷 (`id`, `name`, `platformFeeRate`, `storeName?`, `storeUrl?`) |
| `bankId` | `string?` | 매입·수익 라인 출금/입금 계좌 FK |
| `bank` | `BankSummary?` | 계좌 스냅샷 |

---

## 부록 B. FE 연동 현황 (2026-06)

| 기능 | API | FE |
|------|-----|-----|
| 정산 추이 | `GET /ledger/summary?period=` | ✅ |
| 월 탭 범위 | `GET /ledger/earliest-month` | ✅ |
| 매입 3종 | `/purchase/*` | ✅ |
| 구매처 | `/vendors` | ✅ |
| 매출·순익 추정 | `/sales`, `/sales/estimate-margin` | ✅ |
| 판매채널 | `/sales-channels` | ✅ (name만) / ❌ (§10-2 확장) |
| 수익 | `/income`, `/banks` | ✅ |
| 상품·카테고리·이력 | `/products`, `/categories`, `*-history` | ✅ |
| 이미지 업로드 | `POST /upload` | ✅ |
| 엑셀 | `GET /export/*` | ✅ (BE 미배포 시 에러) |
| 인증 | `POST /auth/login`, `/auth/refresh` | ✅ |
| 전역 검색 | `GET /ledger/search` | ❌ (시드+localStorage) |
| 대시보드 | 미정의 | ❌ (빈 화면) |
| 설정(마진·수수료) | 미정의 | ❌ (빈 화면) |
| 월말 점검·대사 | 미정의 | ❌ |
| 주문번호 중복 검사 | 미정의 | ❌ |

---

## 13. 문서 보완 — 이미 FE 연동 중 (BE 구현·문서화 필요)

> 아래는 **기존 가이드에 누락**되었으나 FE가 이미 호출하는 API입니다. BE 구현 시 이 절을 기준으로 맞춰 주세요.

### 13-1. 구매처

> 화면: 상품매입 등록·수정, 구매처 관리 모달

| API | 설명 |
|-----|------|
| `GET /vendors` | 목록 (soft delete 제외) |
| `POST /vendors` | `{ name, link? }` |
| `PATCH /vendors/:id` | 동일 필드 수정 |
| `DELETE /vendors/:id` | soft delete |

매입 라인 body·응답: `vendorId` (필수 권장) + `vendorSnapshot` (`{ id, name, link }`).

상품매입 목록은 **결제일 → 구매처** 2단 그룹:

```jsonc
// GET /purchase/products 응답 그룹 (paymentDate 단위)
{
  "paymentDate": "2026-06-04",
  "groupMeta": { "groupName": "...", "extraFees": [], "discounts": [], "orderCancelled": false },
  "vendorGroups": [
    {
      "vendorId": "ven-001",
      "vendorSnapshot": { "id": "ven-001", "name": "도매몰A", "link": "" },
      "extraFees": [{ "id": "adj-1", "label": "배송비", "amount": 3500 }],
      "discounts": [],
      "orderCancelled": false,
      "lines": [ /* ProductPurchaseLine[] */ ],
      "totals": {
        "linesTotal": 150000,
        "extraFeesTotal": 3500,
        "discountsTotal": 0,
        "subtotal": 153500
      }
    }
  ],
  "totals": { "linesTotal": 150000, "extraFeesTotal": 3500, "discountsTotal": 0, "subtotal": 153500 }
}
```

| API | 설명 |
|-----|------|
| `PATCH /purchase/groups/vendor` | `{ paymentDate, vendorId, extraFees?, discounts? }` |
| `PATCH /purchase/groups/vendor/cancel` | `{ paymentDate, vendorId, orderCancelled }` |

---

### 13-2. 매출 추정 순익 (`marginEstimate`)

> 화면: 매출 목록·등록/수정 모달 하단

**목록·등록·수정 응답** (`GET/POST/PATCH /sales`)에 주문별 `marginEstimate` 포함.  
`status: "cancelled"` → `marginEstimate: null`.

```jsonc
{
  "marginEstimate": {
    "estimatedCostTotal": 30000,
    "estimatedGrossProfit": 22000,
    "estimatedVatAmount": 4727,
    "estimatedPlatformFeeAmount": 3308,
    "estimatedNetProfit": 13965,
    "hasUnknownCost": false,
    "assumptions": {
      "vatNote": "포함가 × 10/110",
      "platformFeeNote": "결제금액 × 6.36% (스마트스토어 · OO피규어)"
    }
  }
}
```

| 필드 | 계산 |
|------|------|
| `estimatedGrossProfit` | `totalAmount - estimatedCostTotal` |
| `estimatedVatAmount` | 포함가 기준 `× 10/110` |
| `estimatedPlatformFeeAmount` | `totalAmount × platformFeeRate` — **주문 `channel` 스냅샷** 또는 §10-2 fallback |
| `estimatedNetProfit` | gross − VAT − 수수료 |
| `hasUnknownCost` | 품목 원가(매입 단가) 미확인 시 `true` |

**미리보기**: `POST /sales/estimate-margin` — 등록 body와 동일. body의 `channelId`로 수수료율 조회.

> 부가세: `GET /settings` → `vatExtractRate` (채널 무관). 수수료: §10-2 채널별 `platformFeeRate`.

---

### 13-3. 엑셀 다운로드

> 화면: 장부 각 탭 월 선택 행 우측

| API | 쿼리 | 파일 |
|-----|------|------|
| `GET /export/purchase` | `year=2026` 또는 `month=2026-06` | `매입_2026.xlsx` / `매입_2026-06.xlsx` |
| `GET /export/sales` | 동일 | `매출_*.xlsx` |
| `GET /export/income` | 동일 | `수익_*.xlsx` |
| `GET /export/products` | `scope=all` \| `active` | `상품목록_전체.xlsx` / `상품목록_활성.xlsx` |

- 응답: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (JSON 래핑 없음)
- `Content-Disposition: attachment; filename*=UTF-8''...`
- 해당 기간 데이터 없음 → `404` + `{ error: { code: "NOT_FOUND" } }`

---

## 14. 기능 추가 요청 (2026-06)

> **배경**: 1인 셀러, 세금 신고·장부 정리, 실제 판매 상태 점검이 목적. 스마트스토어 API는 추후 연동 예정(현재 없음).  
> **우선순위**: P0(즉시) → P1(월말·정산) → P2(편의) → P3(API 연동 준비)

### 우선순위 요약

| 순위 | 기능 | 화면 | 신규·확장 API |
|------|------|------|----------------|
| **P0** | 대시보드 | `/dashboard` | `GET /dashboard/overview` |
| **P0** | 판매채널 확장 | 매출 채널 관리 | `POST/PATCH /sales-channels` 필드 확장 (§10-2) |
| **P0** | 마진·부가세 설정 | `/settings` | `GET /settings`, `PATCH /settings` |
| **P1** | 월말 점검 체크리스트 | 대시보드 또는 장부 | `GET /ledger/monthly-review` |
| **P1** | 매출 ↔ 수익 대사 | 장부·대시보드 | `GET /reconciliation/sale-income` + 수익 필드 확장 |
| **P2** | 장부·엑셀 합계 교차검증 | 대시보드 | `GET /ledger/monthly-totals` (또는 monthly-review에 포함) |
| **P2** | 상품 재고 상태 필터 | 상품관리 | `GET /products?stockStatus=` |
| **P2** | 주문번호 중복 검사 | 매출 등록 모달 | `GET /sales/check-order-no` |
| **P3** | 스마트스토어 연동 준비 | — | 스키마·제약 (아래 §14-8) |

---

### 14-1. [P0] 대시보드 집계 — `GET /dashboard/overview`

**목적**: “이번 달 잘 팔고 있나?” + 세금·정산 전 한눈에 확인.

| 파라미터 | 필수 | 값 |
|----------|------|-----|
| `month` | 선택 | `YYYY-MM` (기본: 오늘 기준 이번 달) |

**응답**

```jsonc
{
  "data": {
    "month": "2026-06",
    "compareMonth": "2026-05",       // 전월 (데이터 없으면 null)
    "purchase": {
      "total": 232500,               // 상품매입+부가 (기타지출 제외)
      "count": 4,
      "prevTotal": 200000,
      "changePercent": 16.25         // 전월 대비 %, prev 없으면 null
    },
    "sale": {
      "normalTotal": 120000,
      "normalCount": 5,
      "prevTotal": 126000,
      "changePercent": -4.76,
      "estimatedNetProfitTotal": 45000  // 해당 월 정상 주문 marginEstimate.estimatedNetProfit 합
    },
    "income": {
      "total": 115000,
      "count": 3,
      "prevTotal": 100000,
      "changePercent": 15
    },
    "alerts": {
      "purchaseStockPendingCount": 3,  // stockReflected=false 상품매입 라인 수
      "saleUnknownCostCount": 1,       // hasUnknownCost=true 정상 주문 수
      "outOfStockCount": 2,            // active && stock<=0
      "lowStockCount": 5               // active && 0<stock<=safetyStock
    },
    "today": {
      "purchaseTotal": 0,              // 오늘 결제일 매입(상품+부가)
      "saleTotal": 35000,                // 오늘 정상 매출 totalAmount 합
      "incomeTotal": 0,                  // 오늘 입금 amount 합
      "stockDelta": -3                   // 오늘 재고 변동 합 (매출차감+매입반영, 정수)
    },
    "cumulative": {
      "otherExpenseTotal": 660000,     // 기타지출 전체 누적 (period 무관)
      "netTotal": -545000              // income(이번달) - otherExpense(누적), ledger/summary와 동일 규칙
    }
  }
}
```

**BE 참고**

- `GET /ledger/summary`와 날짜·집계 규칙을 **동일**하게 유지 (매입 `payment_date`, 매출 `order_date`+`normal`, 수익 `deposit_date`).
- `estimatedNetProfitTotal`: 취소 주문 제외, `marginEstimate` 없으면 0 처리.

---

### 14-2. [P0] 사용자 설정 — `GET /settings`, `PATCH /settings`

**목적**: 추천 판매가 마진·부가세 환산율 등 **채널과 무관한 전역값** 관리.  
플랫폼 수수료는 **§10-2 판매채널 `platformFeeRate`** 에서 채널별 관리.

**단일 사용자**: 계정당 설정 1행 (JWT `userId` 기준).

**`GET /settings` 응답 / `PATCH /settings` body**

```jsonc
{
  "marginMinRate": 0.15,              // 추천 판매가 하한 (0~1)
  "marginMaxRate": 0.50,              // 추천 판매가 상한
  "vatExtractRate": 0.0909090909,     // 부가세 환산 (10/110). 채널 무관
  "defaultPlatformFeeRate": 0.0636,   // 선택: channelId 없을 때 marginEstimate fallback
  "defaultChannelId": "ch-001"        // 매출 등록 기본 채널, null 가능
}
```

**검증**

- `marginMinRate` ≤ `marginMaxRate`
- rate 필드: 0 이상 1 이하 (`defaultPlatformFeeRate`는 0~0.2 권장)

**연동 범위**

| 기능 | 반영 |
|------|------|
| `marginEstimate` — VAT | `vatExtractRate` |
| `marginEstimate` — 수수료 | 주문 `channel.platformFeeRate` → 없으면 `defaultPlatformFeeRate` |
| 매입 추천판매가 | `marginMinRate`, `marginMaxRate` |
| 매출 등록 모달 | `defaultChannelId` |

---

### 14-3. [P1] 월말 점검 — `GET /ledger/monthly-review`

**목적**: 세금·정산 전 “빠진 것” 체크리스트.

| 파라미터 | 필수 | 값 |
|----------|------|-----|
| `month` | **필수** | `YYYY-MM` |

**응답**

```jsonc
{
  "data": {
    "month": "2026-06",
    "checks": [
      {
        "id": "purchase_stock_pending",
        "label": "재고 미반영 매입",
        "status": "warning",           // ok | warning | error
        "count": 3,
        "detailUrl": "/ledger?tab=purchase&purchaseSub=product&month=2026-06"
      },
      {
        "id": "sale_unknown_cost",
        "label": "원가 미확인 매출",
        "status": "warning",
        "count": 1
      },
      {
        "id": "sale_income_gap",
        "label": "매출·입금 금액 차이",
        "status": "warning",
        "saleTotal": 120000,
        "incomeTotal": 115000,
        "diff": 5000
      },
      {
        "id": "cancelled_orders",
        "label": "취소 처리된 주문",
        "status": "ok",
        "count": 2
      }
    ],
    "items": {
      "purchaseStockPending": [
        { "id": "pp-001", "paymentDate": "2026-06-04", "productName": "...", "vendor": "도매몰A" }
      ],
      "saleUnknownCost": [
        { "id": "so-002", "orderNo": "NV-...", "orderDate": "2026-06-03", "totalAmount": 32000 }
      ]
    }
  }
}
```

**판정 기준**

| check id | warning 조건 |
|----------|----------------|
| `purchase_stock_pending` | 해당 월 결제일 + `stockReflected=false` 라인 1건 이상 |
| `sale_unknown_cost` | 해당 월 `status=normal` + `marginEstimate.hasUnknownCost=true` |
| `sale_income_gap` | `|sale.normalTotal - income.total| > 0` (동월, 기타지출 미포함) |

---

### 14-4. [P1] 매출 ↔ 수익 대사 — `GET /reconciliation/sale-income`

**목적**: 스마트스토어 API 전에도 “매출은 있는데 입금 없음 / 입금만 있음” 수동 점검.

| 파라미터 | 필수 | 값 |
|----------|------|-----|
| `month` | **필수** | `YYYY-MM` |
| `channelId` | 선택 | 특정 채널만 |

**수익 라인 필드 확장 (선행)**

`income` 등록·수정 body / 응답에 선택 필드 추가:

```jsonc
{
  "orderNo": "NV-260604-12345",    // 스마트스토어 주문번호 등 (대사 키)
  "linkedSaleOrderId": "so-001"    // 명시 연결 시 (선택)
}
```

**매칭 규칙 (우선순위)**

1. `linkedSaleOrderId` 일치
2. 없으면 동월 `orderNo` 문자열 일치 (매출 `orderNo` ↔ 수익 `orderNo`)
3. 미매칭 → 각각 “미연결” 목록에 포함

**응답**

```jsonc
{
  "data": {
    "month": "2026-06",
    "summary": {
      "saleTotal": 120000,
      "incomeTotal": 115000,
      "matchedCount": 4,
      "saleOnlyCount": 1,
      "incomeOnlyCount": 0
    },
    "saleOnly": [
      { "id": "so-003", "orderNo": "NV-...", "orderDate": "2026-06-10", "totalAmount": 5000, "channel": "스마트스토어" }
    ],
    "incomeOnly": [
      { "id": "inc-002", "depositDate": "2026-06-12", "itemName": "네이버 정산", "amount": 3000, "orderNo": null }
    ],
    "matched": [
      { "saleOrderId": "so-001", "incomeLineId": "inc-001", "orderNo": "NV-...", "saleAmount": 52000, "incomeAmount": 48000, "diff": 4000 }
    ]
  }
}
```

---

### 14-5. [P2] 월별 합계 교차검증 — `GET /ledger/monthly-totals`

**목적**: 장부 화면·엑셀 export 숫자가 같은지 신고 전 자가 검증.  
(§14-3 `sale_income_gap`과 중복 가능 → **monthly-review에 통합해도 무방**.)

| 파라미터 | 필수 | 값 |
|----------|------|-----|
| `month` | **필수** | `YYYY-MM` |

**응답** — `GET /export/*` 집계와 **동일 규칙**이어야 함.

```jsonc
{
  "data": {
    "month": "2026-06",
    "purchase": {
      "productTotal": 192500,
      "supplyTotal": 40000,
      "otherTotal": 0,
      "grandTotal": 232500
    },
    "sale": {
      "normalTotal": 120000,
      "normalCount": 5,
      "cancelledCount": 1
    },
    "income": {
      "total": 115000,
      "vatTotal": 10000,
      "commissionTotal": 5000,
      "count": 3
    }
  }
}
```

---

### 14-6. [P2] 상품 재고 상태 필터 — `GET /products` 확장

**목적**: 품절·품절임박만 보고 판매 중 SKU 관리.

| 쿼리 | 설명 |
|------|------|
| `stockStatus` | `out_of_stock` \| `low_stock` \| `in_stock` (복수 comma 구분 가능) |

**판정** (`active=true` 기준)

| 값 | 조건 |
|----|------|
| `out_of_stock` | `stock <= 0` |
| `low_stock` | `stock > 0 && stock <= safetyStock` |
| `in_stock` | `stock > safetyStock` |

기존 `active`, `q`, `page`, `limit`와 조합.

---

### 14-7. [P2] 주문번호 중복 검사 — `GET /sales/check-order-no`

**목적**: 수동 입력 시 동일 주문 이중 등록 방지 (API 연동 전).

| 파라미터 | 필수 | 설명 |
|----------|------|------|
| `orderNo` | **필수** | 검사할 주문번호 (trim, 대소문자 무시 권장) |
| `excludeId` | 선택 | 수정 모달 시 자기 주문 제외 |

**응답**

```jsonc
{
  "data": {
    "exists": true,
    "order": {
      "id": "so-001",
      "orderNo": "NV-260604-12345",
      "orderDate": "2026-06-04",
      "status": "normal"
    }
  }
}
```

**등록·수정 시 서버 검증 (권장)**

- `POST /sales`, `PATCH /sales/:id`에서 동일 `orderNo` 존재 시 `409 Conflict`  
  (`error.code`: `DUPLICATE_ORDER_NO`)

---

### 14-10. [P0] 판매채널 필드 확장

> **상세 스펙**: §10-2. FE는 `name`만 연동 중 → BE 배포 후 관리 모달·타입 확장.

**요청 요약**

| 항목 | 내용 |
|------|------|
| API | `GET/POST/PATCH /sales-channels` — `platformFeeRate`, `storeName`, `storeUrl` 추가 |
| 스냅샷 | `GET /sales` 등 `channel` 객체에 동일 필드 포함 |
| 순익 | `marginEstimate` 수수료 = 채널 `platformFeeRate` (§13-2) |
| 부가세 | 전역 `settings.vatExtractRate` — 채널 필드 **없음** |
| 마이그레이션 | 기존 채널 `platformFeeRate` → `0.0636` backfill |

**우선순위**: 대시보드·설정과 동급 P0 (순익 추정 정확도에 직결).

---

### 14-8. [P3] 스마트스토어 API 연동 준비 (스키마만)

> 지금 구현 불필요. 연동 전 데이터·제약만 맞춰 두면 됨.

| 항목 | 권장 |
|------|------|
| `sale_orders.order_no` | UNIQUE (삭제·취소 주문 제외 시 partial unique) |
| `sale_orders` | `externalOrderId`, `externalSource` (`smartstore`) nullable 컬럼 예약 |
| `income_lines.order_no` | §14-4 대사용 |
| 판매채널 | `sales_channels` — §10-2 `storeUrl`, `code`(`smartstore`) nullable (§10-2 P3) |
| 동기화 | 추후 `POST /integrations/smartstore/sync` 등 별도 스펙 |

---

### 14-9. 기존 API 보완 (선택)

| API | 보완 내용 |
|-----|-----------|
| `GET /ledger/search` | §2 전역 검색 — FE 시드 제거·API 연동 대기 |
| `GET /ledger/summary` | `period=month` 시 전월 대비 `changePercent` meta 추가 (dashboard와 중복 시 dashboard만 구현해도 됨) |
| `GET /products` | 응답 meta에 `outOfStockCount`, `lowStockCount` (대시보드 alerts와 공유) |

---

## 15. 가격 수정 시 이전 금액 표시 (FE 연동 예정)

> **목적**: 상품관리·상품매입에서 금액을 수정했을 때, FE가  
> `~~이전금액~~` → `수정된 금액` (line-through + 신규 값) 형태로 표시할 수 있도록 BE가 **직전 값**을 내려준다.  
> **우선순위**: P1 (상품 `currentPrice`, 상품매입 `paymentAmount` / 파생 단가)

### 15-1. 설계 원칙

| 원칙 | 내용 |
|------|------|
| **현재값 + 직전값** | 목록·상세·PATCH 응답에 `current` 필드와 짝이 되는 `previous*` 필드를 둔다 |
| **null = 표시 안 함** | `previous*`가 `null`이거나 현재값과 같으면 FE는 취소선을 그리지 않음 |
| **마지막 1회 수정만** | “몇 번 전 가격”이 아니라 **바로 이전 값 1개**만 유지 (다회 수정 이력은 `price_history` 등 기존 이력 API) |
| **서버 계산** | FE에서 이전값을 추론하지 않음 — PATCH 직후·새로고침 후에도 동일하게 보이려면 BE가 보관·반환 |

**FE 표시 규칙 (참고)**

```text
previousPrice != null && previousPrice !== currentPrice
  →  <s>15,000원</s> 12,000원
```

---

### 15-2. 상품관리 (`products`)

#### 대상 필드

| 필드 | 설명 |
|------|------|
| `currentPrice` | 현재 판매가 (기존) |
| `previousPrice` | **신규** — 직전 `currentPrice`. 가격이 마지막으로 바뀐 뒤 유지 |

#### 값을 세팅하는 시점

| 이벤트 | `previousPrice` | `price_history` |
|--------|-----------------|-----------------|
| `POST /products` (등록) | `null` | `source: product_register`, `price = currentPrice` |
| `PATCH /products/:id` — `currentPrice` **변경** | 변경 전 `currentPrice` 저장 | `source: manual_edit`, `price = 신규값`, **`previousPrice = 변경 전값`** |
| `PATCH /products/:id` — `currentPrice` **동일** | 기존 `previousPrice` 유지 | 추가 없음 |
| `POST .../stock-reflect` — 단가로 `currentPrice` 갱신 | 변경 전 `currentPrice` 저장 | `source: purchase`, `price = 신규값`, **`previousPrice = 변경 전값`** |
| `currentPrice` 외 필드만 수정 | `previousPrice` 유지 | 가격 이력 추가 없음 |

#### API 응답 확장

**`GET /products`**, **`GET /products/:id`**, **`PATCH /products/:id`** 응답 `data`에 추가:

```jsonc
{
  "id": "prd-001",
  "currentPrice": 28000,
  "previousPrice": 25000,           // null 가능
  "priceAmendedAtIso": "2026-06-09T10:30:00Z"  // 선택. 마지막 가격 변경 시각
}
```

- `priceAmendedAtIso`: FE 필수는 아님. 정렬·툴팁용으로 권장.

#### 가격 이력 API 확장

**`GET /products/:id/price-history`** 항목에 `previousPrice` 추가 (변경 이벤트만):

```jsonc
{
  "id": "prh-002",
  "atIso": "2026-06-09T10:30:00Z",
  "price": 28000,
  "previousPrice": 25000,          // 등록 최초 건(product_register)은 null
  "source": "manual_edit",           // product_register | manual_edit | purchase
  "reason": "상품 편집"
}
```

> FE 이력 탭: `previousPrice`가 있으면 동일하게 취소선 + 신규 가격 표시.

#### (선택) 목록용 경량 태그

상세 없이 목록 카드만 갱신할 때, 기존 `changeKind` / `changeFrom` 패턴을 가격에도 쓸 수 있음:

```jsonc
{
  "currentPrice": 28000,
  "previousPrice": 25000,
  "changeKind": "price",             // 선택
  "changeFrom": "edit"               // edit | purchase (stock_adjust는 재고 전용)
}
```

- 둘 다 있을 때만 FE가 「금액조정 · 편집수정」 뱃지 표시 (기존 규칙 유지).

---

### 15-3. 상품매입 라인 (`purchase/products`)

#### 대상 필드

| 필드 | 설명 |
|------|------|
| `paymentAmount` | 결제금액 (기존) |
| `previousPaymentAmount` | **신규** — 직전 `paymentAmount` |
| `quantity` | 기존 |
| `previousQuantity` | **신규** — 직전 `quantity` (수량만 바뀐 경우 단가 비교용) |

파생 단가는 **BE가 내려주거나 FE가 계산** — 권장은 응답에 명시 필드 포함:

| 필드 | 계산 |
|------|------|
| `unitPrice` | `paymentAmount / quantity` (정수 반올림 정책은 기존 FE와 동일) |
| `previousUnitPrice` | `previousPaymentAmount / previousQuantity` — 둘 중 하나라도 `null`이면 `null` |

#### 값을 세팅하는 시점

| 이벤트 | `previousPaymentAmount` / `previousQuantity` |
|--------|--------------------------------------------------|
| `POST /purchase/products` | 둘 다 `null` |
| `PATCH /purchase/products/:id` — 금액 또는 수량 **변경** | 변경 전 `paymentAmount` / `quantity` 저장 |
| `PATCH` — 금액·수량 **동일** | 기존 `previous*` 유지 |
| `POST .../stock-reflect` | 라인 금액은 그대로 → `previous*` **변경 없음** (상품 마스터 가격 변경은 §15-2) |
| `DELETE .../stock-reflect` | `previous*` 유지 |

> **제약**: `stockReflected: true` 라인은 수정 불가(기존 §3-3). 이전 금액 필드는 **미반영·수정 가능 구간**에서만 의미 있음.

#### API 응답 확장

**`GET /purchase/products`**, **`PATCH /purchase/products/:id`** 의 각 라인 객체:

```jsonc
{
  "id": "ppl-001",
  "quantity": 10,
  "paymentAmount": 140000,
  "previousQuantity": 10,
  "previousPaymentAmount": 150000,
  "unitPrice": 14000,
  "previousUnitPrice": 15000,
  "amountAmendedAtIso": "2026-06-09T11:00:00Z"   // 선택
}
```

**FE 표시 예 (상품매입 목록)**

| 컬럼 | 표시 |
|------|------|
| 결제금액 | `~~150,000원~~` `140,000원` |
| 개당금액 | `~~15,000원~~` `14,000원` |
| 최종개당 | 구매처 그룹 배분 로직은 기존 FE 계산 유지. 그룹 합계가 바뀌면 해당 라인 `previous*`와 무관할 수 있음 → **라인 단위 금액·단가만** 이전값 표시 |

#### 수정 이력 테이블 (권장)

감사·월말 점검용으로 라인별 수정 로그를 남기려면:

```sql
purchase_product_line_amendments (
  id,
  line_id,
  previous_payment_amount,
  previous_quantity,
  new_payment_amount,
  new_quantity,
  amended_at,
  amended_by_user_id   -- nullable
)
```

- 목록 API는 **마지막 1건**만 `previous*`로 노출해도 됨.
- 전체 이력이 필요하면 추후 `GET /purchase/products/:id/amendments` (P2).

---

### 15-4. DB · 마이그레이션

```sql
-- products
ALTER TABLE products
  ADD COLUMN previous_price INTEGER NULL,
  ADD COLUMN price_amended_at TIMESTAMPTZ NULL;

-- product_price_history (기존 테이블)
ALTER TABLE product_price_history
  ADD COLUMN previous_price INTEGER NULL;

-- purchase_product_lines
ALTER TABLE purchase_product_lines
  ADD COLUMN previous_payment_amount INTEGER NULL,
  ADD COLUMN previous_quantity INTEGER NULL,
  ADD COLUMN amount_amended_at TIMESTAMPTZ NULL;
```

- 기존 행: `previous_*` = `NULL` (취소선 없음).
- backfill 불필요.

---

### 15-5. 비대상 · 추후

| 구분 | 사유 |
|------|------|
| 부가(`purchase/supply`)·기타지출 | 금액 수정 빈도 낮음 — 필요 시 동일 패턴으로 `previousPaymentAmount` 확장 (P2) |
| 매출 주문·항목 | 주문 수정 시 diff는 BE 내부 처리 중 — UI 취소선 요구 시 §15와 별도 스펙 (P2) |
| `previous*` 영구 보관 | 다음 수정 시 **덮어쓰기** (직전 1회만). 장기 이력은 `price_history` / amendment 로그 |

---

### 15-6. FE 연동 체크리스트 (BE 완료 후)

- [ ] `types/inventory-product.ts` — `previousPrice?`, `priceAmendedAtIso?`
- [ ] `types/purchase-product.ts` — `previousPaymentAmount?`, `previousQuantity?`, `unitPrice?`, `previousUnitPrice?`
- [ ] `price-history` 항목 — `previousPrice?`
- [ ] 상품 상세·목록·상품매입 라인 테이블 — 공통 `AmendedAmount` UI (line-through + 신규값)
- [ ] `normalizeProduct` / `normalizeProductPurchaseLine` 파서 반영

---

*v3.2 — §15 가격 수정 이전값 표시 스펙 추가 (2026-06-09)*  
*v3.1 — 판매채널 필드 확장 요청 추가 (2026-06-04)*
>>>>>>> ef65b5bd93d744ad1c61efec1398d71f5c6c0ad4
=======
>>>>>>> 205f7625a7f91375ea8f128192eea78a57be28fe
