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

> 화면: 장부 헤더 검색 아이콘 → 모달  
> **FE 연동 상태**: 미연동 (시드 + localStorage 상품). 아래 스펙은 2차 목표.

### `GET /ledger/search`

| 파라미터 | 필수 | 설명 |
|----------|------|------|
| `q` | ✓ | 검색어 |
| `page` | — | 기본 1 |
| `limit` | — | 기본 30 |

**응답**

```jsonc
{
  "data": [
    {
      "id": "pp-001",
      "tab": "purchase",               // purchase | sale | income | products
      "purchaseSub": "product",        // product | supply | other (tab=purchase 일 때)
      "month": "2026-06",              // YYYY-MM (상품관리 제외)
      "tabLabel": "매입",
      "subLabel": "상품매입",          // 있을 때
      "title": "플레이브 피규어 A",
      "subtitle": "도매몰A · NV-240501-01",
      "date": "2026-06-04"
    }
  ],
  "meta": { "total": 12, "page": 1, "limit": 30 }
}
```

> **딥링크**: FE는 응답의 `tab` / `purchaseSub` / `month` / `q` 로 URL 구성 후 이동.

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
      "channel": {                   // 스냅샷, channelId 있을 때
        "id": "ch-001",
        "name": "스마트스토어"
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

> 화면: 매출 등록 — 채널 선택·관리

| API | 설명 |
|-----|------|
| `GET /sales-channels` | 목록 (soft delete 제외) |
| `POST /sales-channels` | `{ name }` |
| `PATCH /sales-channels/:id` | `{ name }` |
| `DELETE /sales-channels/:id` | soft delete |

매출 주문에는 `channelId` + `channel` 스냅샷 (`{ id, name }`).

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
| `channel` | `{ id, name }?` | 등록 시점 스냅샷 |
| `bankId` | `string?` | 매입·수익 라인 출금/입금 계좌 FK |
| `bank` | `BankSummary?` | 계좌 스냅샷 |

---

## 부록 B. FE 연동 현황 (2026-06)

| 기능 | API | FE |
|------|-----|-----|
| 정산 추이 | `GET /ledger/summary?period=` | ✅ |
| 월 탭 범위 | `GET /ledger/earliest-month` | ✅ |
| 매입 3종 | `/purchase/*` | ✅ |
| 매출 | `/sales`, `/sales-channels` | ✅ |
| 수익 | `/income`, `/banks` | ✅ |
| 상품·카테고리·이력 | `/products`, `/categories`, `*-history` | ✅ |
| 이미지 업로드 | `POST /upload` | ✅ |
| 인증 | `POST /auth/login`, `/auth/refresh` | ✅ |
| 전역 검색 | `GET /ledger/search` | ❌ (시드+localStorage) |
| 엑셀 | `GET /report/export` 등 | ❌ (2차) |
| 설정(마진·수수료) | 미정의 | ❌ (2차) |

---

*v2 — FE API 연동 기준 갱신 (2026-06-08)*
