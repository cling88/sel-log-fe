# Sellog ??BE API ?곕룞 媛?대뱶

> **FE API ?곕룞 湲곗?** (2026-06). ?쒕퉬??濡쒖쭅 ?몃??댁슜? `service-guide.md` 李몄“.  
> ??臾몄꽌??**媛??붾㈃쨌湲곕뒫蹂??꾩슂 API, ?붿껌媛? ?묐떟媛?* ?꾩＜濡??뺣━?쒕떎.  
> FE??釉뚮씪?곗??먯꽌 `/api/v1` ??Next.js rewrite濡?BE ?꾨줉??(`API_PROXY_TARGET`).

---

## 怨듯넻 洹쒖빟

### Base URL

```
/api/v1
```

### ?묐떟 ?щ㎎

```jsonc
// ?깃났
{ "data": <payload>, "meta": { "total": 120, "page": 1, "limit": 20 } }

// ?먮윭
{ "error": { "code": "NOT_FOUND", "message": "..." } }
```

### 怨듯넻 荑쇰━ ?뚮씪誘명꽣 (紐⑸줉 API 怨듯넻)

| ?뚮씪誘명꽣 | ???| ?ㅻ챸 |
|----------|------|------|
| `q` | string | 寃?됱뼱 (??퀎 ????꾨뱶???섎떒 媛?API 李몄“) |
| `month` | `YYYY-MM` | ???꾪꽣 |
| `page` | number | ?섏씠吏 踰덊샇 (1-based, 湲곕낯 1) |
| `limit` | number | ?섏씠吏 ?ш린 (湲곕낯 20) |

### ?몄쬆

- 蹂댄샇 API: `Authorization: Bearer <accessToken>` ?ㅻ뜑 ?꾩슂
- FE: accessToken? 荑좏궎 `sellog_token` + localStorage, refreshToken? localStorage

| API | ?ㅻ챸 |
|-----|------|
| `POST /auth/login` | `{ email, password }` ??`{ accessToken, refreshToken, user }` |
| `POST /auth/refresh` | `{ refreshToken }` ???좏겙 濡쒗뀒?댁뀡 (?숈씪 援ъ“) |

濡쒓렇?꾩썐? FE?먯꽌 ?몄뀡 ??젣留??섑뻾 (蹂꾨룄 BE API ?놁쓬).

---

## 1. ?λ? ?붿빟 (?뺤궛 異붿씠 ?ㅻ뜑)

> ?붾㈃: ?λ? ?곷떒 ?뺤궛 異붿씠 移대뱶 3媛?+ ?섎떒 ?붿빟 臾멸뎄

### `GET /ledger/summary`

**?ㅻ챸**: ?λ? ?곷떒 ?뺤궛 異붿씠 移대뱶 3媛?+ ?섎떒 ?쒖넀??臾멸뎄

| ?뚮씪誘명꽣 | ?꾩닔 | 媛?|
|----------|------|-----|
| `period` | ??| `all`(湲곕낯) \| `year` \| `month` \| `week` \| `today` |

**湲곌컙 ?꾪꽣 ?곸슜 ???*

| ?꾨뱶 | ?좎쭨 而щ읆 | 踰붿쐞 |
|------|-----------|------|
| `purchase.*` | `payment_date` | ?곹뭹留ㅼ엯 + 遺媛留?(湲고?吏異??쒖쇅) |
| `sale.*` | `order_date` | `status = normal` 留?|
| `income.*` | `deposit_date` | ?낃툑 ?꾩껜 |

- `otherExpense.total`? **`period`? 臾닿??섍쾶 ??긽 ?꾩껜 ?꾩쟻**
- `netTotal` = `income.total`(?좏깮 湲곌컙) ??`otherExpense.total`(?꾩쟻) ???쒕쾭 怨꾩궛媛??ъ슜
- `week` = ?대쾲 二??붿슂??UTC) ~ ?ㅻ뒛

**?묐떟**

```jsonc
{
  "data": {
    "period": "month",
    "purchase": {
      "productTotal": 192500,
      "supplyTotal": 40000,
      "total": 232500,
      "count": 4              // ?곹뭹+遺媛 ?쇱씤 嫄댁닔
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

**?ㅻ챸**: ?곕룄쨌??퀎 理쒖큹 ?곗씠??????????踰붿쐞 (?곹뭹愿由???? 誘명샇異?

| ?뚮씪誘명꽣 | ?꾩닔 | 媛?|
|----------|------|-----|
| `year` | ??| 2000~2100 |
| `tab` | ??| `purchase` \| `sale` \| `income` |

```jsonc
{
  "data": {
    "year": 2026,
    "tab": "purchase",
    "month": "2026-03"   // ?대떦 ?곕룄???곗씠???놁쑝硫?null
  }
}
```

| `tab` | ?좎쭨 湲곗? |
|-------|-----------|
| `purchase` | ?곹뭹留ㅼ엯 + 遺媛 + 湲고? `payment_date` 以?媛???대Ⅸ ??|
| `sale` | `sale_orders.order_date` |
| `income` | `income_lines.deposit_date` |

---

## 2. ?꾩뿭 寃??
> ?붾㈃: ?λ? ?ㅻ뜑 寃???꾩씠肄???紐⑤떖  
> **FE ?곕룞 ?곹깭**: 誘몄뿰??(?쒕뱶 + localStorage ?곹뭹). ?꾨옒 ?ㅽ럺? 2李?紐⑺몴.

### `GET /ledger/search`

| ?뚮씪誘명꽣 | ?꾩닔 | ?ㅻ챸 |
|----------|------|------|
| `q` | ??| 寃?됱뼱 |
| `page` | ??| 湲곕낯 1 |
| `limit` | ??| 湲곕낯 30 |

**?묐떟**

```jsonc
{
  "data": [
    {
      "id": "pp-001",
      "tab": "purchase",               // purchase | sale | income | products
      "purchaseSub": "product",        // product | supply | other (tab=purchase ????
      "month": "2026-06",              // YYYY-MM (?곹뭹愿由??쒖쇅)
      "tabLabel": "留ㅼ엯",
      "subLabel": "?곹뭹留ㅼ엯",          // ?덉쓣 ??      "title": "?뚮젅?대툕 ?쇨퇋??A",
      "subtitle": "?꾨ℓ紐캚 쨌 NV-240501-01",
      "date": "2026-06-04"
    }
  ],
  "meta": { "total": 12, "page": 1, "limit": 30 }
}
```

> **?λ쭅??*: FE???묐떟??`tab` / `purchaseSub` / `month` / `q` 濡?URL 援ъ꽦 ???대룞.

---

## 3. 留ㅼ엯 ???곹뭹留ㅼ엯

> ?붾㈃: ?λ? > 留ㅼ엯 > ?곹뭹留ㅼ엯 ??
### 3-1. 紐⑸줉 議고쉶

**`GET /purchase/products`**

| 荑쇰━ | ?ㅻ챸 |
|------|------|
| `q` | 洹몃９紐? ?곹뭹紐? 援щℓ泥? 二쇰Ц踰덊샇, 鍮꾧퀬 寃??|
| `month` | 寃곗젣?좎쭨 ???꾪꽣 (`YYYY-MM`) |
| `page` / `limit` | ?섏씠吏 |

**?묐떟**: ?좎쭨 湲곗? 洹몃９ 臾띠쓬

```jsonc
{
  "data": [
    {
      "paymentDate": "2026-06-04",
      "groupMeta": {
        "groupName": "留ㅼ엯1",
        "extraFees": [{ "id": "adj-1", "label": "諛곗넚鍮?, "amount": 3500 }],
        "discounts": [],
        "orderCancelled": false
      },
      "lines": [
        {
          "id": "pp-001",
          "paymentDate": "2026-06-04",
          "orderNo": "NV-240501-01",
          "imageUrl": "https://...",   // ?곹뭹 ?대?吏 URL (S3 ??
          "productName": "?뚮젅?대툕 ?쇨퇋??A",
          "productLink": "https://...",
          "vendor": "?꾨ℓ紐캚",
          "quantity": 10,
          "paymentAmount": 150000,
          "memo": "1李??낃퀬",
          "bankId": "bank-001",        // null 媛??          "bank": {                    // ?ㅻ깄?? bankId ?덉쓣 ??            "id": "bank-001",
            "bankName": "援?????,
            "accountNumber": "1234567890",
            "accountHolder": "?띻만??
          },
          "stockReflected": false,
          "productSku": null           // ?ш퀬諛섏쁺 ??null
        }
      ]
    }
  ],
  "meta": { "total": 2, "page": 1, "limit": 20 }
}
```

---

### 3-2. ?쇱씤 ?깅줉

**`POST /purchase/products`**

```jsonc
{
  "paymentDate": "2026-06-04",
  "orderNo": "NV-240501-01",       // ?좏깮
  "imageUrl": "https://...",        // ?좏깮
  "productName": "?뚮젅?대툕 ?쇨퇋??A",
  "productLink": "https://...",     // ?좏깮
  "vendor": "?꾨ℓ紐캚",
  "quantity": 10,
  "paymentAmount": 150000,
  "memo": "1李??낃퀬",               // ?좏깮
  "bankId": "bank-001"              // ?좏깮, null 媛??}
```

**?묐떟**: ?앹꽦??`ProductPurchaseLine` 媛앹껜 (`bank` ?ㅻ깄???ы븿 媛??

---

### 3-3. ?쇱씤 ?섏젙

**`PATCH /purchase/products/:id`**

```jsonc
{
  "paymentDate": "2026-06-04",
  "orderNo": "NV-240501-01",
  "imageUrl": "https://...",
  "productName": "?뚮젅?대툕 ?쇨퇋??A",
  "productLink": "https://...",
  "vendor": "?꾨ℓ紐캚",
  "quantity": 10,
  "paymentAmount": 150000,
  "memo": ""
}
```

> **?쒖빟**: `stockReflected: true` ?쇱씤? ?섏젙 遺덇? 泥섎━ 沅뚯옣 (?먮뒗 FE?먯꽌 李⑤떒)  
> **?묐떟**: 湲덉븸쨌?섎웾 蹂寃???`previousPaymentAmount`, `previousQuantity`, `unitPrice`, `previousUnitPrice` ?ы븿 ??**짠15-3**

---

### 3-4. ?쇱씤 ??젣

**`DELETE /purchase/products/:id`**

> **?쒖빟**: `stockReflected: true` ?대㈃ `409 Conflict` 諛섑솚

---

### 3-5. ?ш퀬諛섏쁺 ?뺤젙

**`POST /purchase/products/:id/stock-reflect`**

```jsonc
{
  "productSku": "SKU-001",   // ?곹뭹愿由ъ쓽 SKU (= ?곹뭹 怨좎쑀 ID)
  "qty": 10                  // 諛섏쁺 ?섎웾 (援щℓ ?섎웾怨??ㅻ? ???덉쓬)
}
```

**BE 泥섎━ ?댁슜**:
1. `purchase_product_lines.stockReflected = true`, `productSku` ???2. ?대떦 SKU ?곹뭹??`stock += qty`
3. `stock_history` ??ぉ 異붽? (source: `purchase`, vendor쨌orderNo쨌unitPrice쨌totalAmount ?ы븿)
4. 諛섏쁺 ?④?(`paymentAmount 첨 qty`) ???꾩옱 `currentPrice` ?대㈃ 媛寃?媛깆떊 + `price_history` 異붽?

**?묐떟**

```jsonc
{
  "data": {
    "line": { /* 媛깆떊??ProductPurchaseLine */ },
    "product": { /* 媛깆떊??InventoryProduct */ }
  }
}
```

---

### 3-6. ?ш퀬諛섏쁺 痍⑥냼

**`DELETE /purchase/products/:id/stock-reflect`**

**?쒖빟**:
- ?대떦 諛섏쁺遺꾩쑝濡?**?대? ?먮ℓ(?ш퀬 李④컧)???섎웾???덉쑝硫?* `409 Conflict`  
  (?? `"?먮ℓ ?댁뿭???덉뼱 ?ш퀬諛섏쁺 痍⑥냼媛 遺덇??⑸땲??"`)
- `currentPrice` / `price_history`??**?섎룎由ъ? ?딆쓬** (媛寃⑹? ?좎?)

**BE 泥섎━ ?댁슜**:
1. `stockReflected = false`, `productSku = null`
2. ?대떦 SKU ?곹뭹??`stock -= qty` (諛섏쁺 ?뱀떆 qty 湲곗?)
3. `stock_history` ??텇媛???ぉ 異붽?

遺媛(`DELETE /purchase/supply/:id/stock-reflect`)???숈씪 ?⑦꽩. ?먮ℓ ?곕룞 媛?쒕뒗 BE ?뺤콉???곕쫫.

---

### 3-7. 洹몃９ 硫뷀? ???(洹몃９紐끒룹텛媛湲댟룻븷??

**`PATCH /purchase/groups`**

```jsonc
{
  "paymentDate": "2026-06-04",   // 洹몃９ ?앸퀎??  "groupName": "留ㅼ엯1",
  "extraFees": [
    { "id": "adj-1", "label": "諛곗넚鍮?, "amount": 3500 }
  ],
  "discounts": []
}
```

---

### 3-8. 洹몃９ 二쇰Ц痍⑥냼 ?좉?

**`PATCH /purchase/groups/cancel`**

```jsonc
{
  "paymentDate": "2026-06-04",
  "orderCancelled": true         // true = 痍⑥냼 泥섎━
}
```

---

## 4. 留ㅼ엯 ??遺媛 (怨듦툒鍮꾩슜)

> ?붾㈃: ?λ? > 留ㅼ엯 > 遺媛 ??
### 4-1. 紐⑸줉 議고쉶

**`GET /purchase/supply`**

| 荑쇰━ | ?ㅻ챸 |
|------|------|
| `q` | ??ぉ紐? 援щℓ泥? 鍮꾧퀬 寃??|
| `month` | 寃곗젣?좎쭨 ???꾪꽣 |
| `page` / `limit` | |

**?묐떟**

```jsonc
{
  "data": [
    {
      "paymentDate": "2026-06-04",
      "lines": [
        {
          "id": "se-001",
          "paymentDate": "2026-06-04",
          "itemName": "怨⑦뙋吏 諛뺤뒪 (以?",
          "vendor": "?ъ옣?щ쭏??,
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

### 4-2. ?쇱씤 ?깅줉

**`POST /purchase/supply`**

```jsonc
{
  "paymentDate": "2026-06-04",
  "itemName": "怨⑦뙋吏 諛뺤뒪 (以?",
  "vendor": "?ъ옣?щ쭏??,     // ?좏깮
  "quantity": 100,
  "paymentAmount": 28000,
  "memo": "",
  "bankId": "bank-001"              // ?좏깮
}
```

---

### 4-3. ?쇱씤 ?섏젙

**`PATCH /purchase/supply/:id`**

> `stockReflected: true` ?쇱씤 ?섏젙 遺덇?

---

### 4-4. ?쇱씤 ??젣

**`DELETE /purchase/supply/:id`**

> `stockReflected: true` ?대㈃ `409` 諛섑솚

---

### 4-5. ?ш퀬諛섏쁺 (遺媛)

**`POST /purchase/supply/:id/stock-reflect`**

```jsonc
{
  "productSku": "PKG-001",
  "qty": 100
}
```

**BE 泥섎━ ?댁슜**: ?곹뭹 stock 利앷? + stockHistory 異붽? (媛寃?媛깆떊 誘몄쟻??

---

### 4-6. ?ш퀬諛섏쁺 痍⑥냼 (遺媛)

**`DELETE /purchase/supply/:id/stock-reflect`**

---

## 5. 留ㅼ엯 ??湲고?吏異?
> ?붾㈃: ?λ? > 留ㅼ엯 > 湲고?吏異???
### 5-1. 紐⑸줉 議고쉶

**`GET /purchase/other`**

| 荑쇰━ | ?ㅻ챸 |
|------|------|
| `q` | ??ぉ紐? 鍮꾧퀬 寃??|
| `month` | 寃곗젣?좎쭨 ???꾪꽣 |

**?묐떟**

```jsonc
{
  "data": [
    {
      "paymentDate": "2026-06-04",
      "lines": [
        {
          "id": "oe-001",
          "paymentDate": "2026-06-04",
          "itemName": "?щТ???붿꽭",
          "paymentAmount": 550000,
          "memo": "5?붾텇",
          "bankId": null,
          "bank": null
        }
      ]
    }
  ]
}
```

---

### 5-2. ?쇱씤 ?깅줉

**`POST /purchase/other`**

```jsonc
{
  "paymentDate": "2026-06-04",
  "itemName": "?щТ???붿꽭",
  "paymentAmount": 550000,
  "memo": "5?붾텇",
  "bankId": "bank-001"              // ?좏깮
}
```

---

### 5-3. ?쇱씤 ?섏젙 / ??젣

- **`PATCH /purchase/other/:id`** ???깅줉怨??숈씪 ?꾨뱶
- **`DELETE /purchase/other/:id`**

---

## 6. 留ㅼ텧

> ?붾㈃: ?λ? > 留ㅼ텧 ??
### 6-1. 紐⑸줉 議고쉶

**`GET /sales`**

| 荑쇰━ | ?ㅻ챸 |
|------|------|
| `q` | 二쇰Ц踰덊샇, 二쇰Ц?먮챸, ?곹뭹紐? 鍮꾧퀬 寃??|
| `month` | 二쇰Ц?????꾪꽣 |
| `status` | `normal` \| `cancelled` (?좏깮, 誘몄??????꾩껜) |
| `page` / `limit` | |

**?묐떟**

```jsonc
{
  "data": [
    {
      "id": "so-001",
      "orderDate": "2026-06-04",
      "orderNo": "SO-260604-01",
      "customerName": "源誘쇱닔",
      "channelId": "ch-001",         // null 媛??      "channel": {
        "id": "ch-001",
        "name": "?ㅻ쭏?몄뒪?좎뼱",
        "platformFeeRate": 0.0636,
        "storeName": "OO?쇨퇋??,
        "storeUrl": "https://smartstore.naver.com/oo-figure"
      },
      "items": [
        {
          "productId": "prd-001",
          "productSku": "SKU-001",
          "productName": "?섑뵆 ?곹뭹 1",
          "quantity": 2,
          "lineAmount": 50000
        }
      ],
      "extraAdjustments": [
        { "id": "adj-1", "label": "諛곗넚鍮?, "amount": 3000 }
      ],
      "discountAdjustments": [
        { "id": "adj-2", "label": "荑좏룿", "amount": 1000 }
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
    "todayTotal": 52000,           // ?ㅻ뒛 ?뺤긽 二쇰Ц ?⑷퀎 (?곷떒 ?붿빟??
    "monthTotal": 120000           // ?대쾲???뺤긽 二쇰Ц ?⑷퀎
  }
}
```

---

### 6-2. 留ㅼ텧 ?깅줉

**`POST /sales`**

```jsonc
{
  "orderDate": "2026-06-04",
  "orderNo": "SO-260604-01",
  "customerName": "源誘쇱닔",
  "channelId": "ch-001",           // ?좏깮
  "items": [
    {
      "productId": "prd-001",
      "quantity": 2,
      "lineAmount": 50000
    }
  ],
  "extraAdjustments": [
    { "label": "諛곗넚鍮?, "amount": 3000 }
  ],
  "discountAdjustments": [],
  "memo": ""
}
```

**BE 泥섎━ ?댁슜**:
1. `totalAmount` 怨꾩궛: `items ??+ extraAdjustments ??- discountAdjustments ??
2. 媛?`productId` ?곹뭹 `stock` 李④컧 (?ш퀬 遺議???`409` 諛섑솚)
3. ?곹뭹蹂?`stock_history` 異붽? (source: `sale`, orderNo쨌梨꾨꼸紐????ы븿)
4. ?묐떟???ㅻ깄??`productSku`, `productName`) ?ы븿

**?묐떟**: ?앹꽦??`SaleOrder` ?꾩껜 (?ㅻ깄???ы븿)

---

### 6-3. 留ㅼ텧 ?섏젙

**`PATCH /sales/:id`**

> `status: "cancelled"` 二쇰Ц? ?섏젙 遺덇? (`403` 諛섑솚)

```jsonc
// ?붿껌: ?깅줉怨??숈씪 援ъ“
```

**BE 泥섎━ ?댁슜**:
1. 湲곗〈 ?ш퀬 李④컧遺?蹂듦뎄
2. ???ш퀬 李④컧 (遺議???`409`)
3. stockHistory 媛깆떊

---

### 6-4. 二쇰Ц 痍⑥냼 / 痍⑥냼?댁젣

**`PATCH /sales/:id/cancel`**

```jsonc
{ "cancel": true }   // true=痍⑥냼泥섎━, false=痍⑥냼?댁젣
```

**BE 泥섎━ ?댁슜**:
- `cancel: true`: `status = "cancelled"`, ?ш퀬 蹂듦뎄 + stockHistory
- `cancel: false`: `status = "normal"`, ?ш퀬 ?ъ감媛?(遺議???`409`)

---

### 6-5. 留ㅼ텧 ??젣

**`DELETE /sales/:id`**

> `status: "normal"` 二쇰Ц ??젣 遺덇? (`409` 諛섑솚)  
> `status: "cancelled"` 二쇰Ц留???젣 ?덉슜 (?ш퀬??痍⑥냼泥섎━ ???대? 蹂듦뎄??

---

## 7. ?섏씡 (?낃툑 湲곕줉)

> ?붾㈃: ?λ? > ?섏씡 ??
### 7-1. 紐⑸줉 議고쉶

**`GET /income`**

| 荑쇰━ | ?ㅻ챸 |
|------|------|
| `q` | ??ぉ紐? 鍮꾧퀬 寃??|
| `month` | ?낃툑?????꾪꽣 |
| `page` / `limit` | |

**?묐떟**

```jsonc
{
  "data": [
    {
      "depositDate": "2026-06-04",
      "lines": [
        {
          "id": "inc-001",
          "depositDate": "2026-06-04",
          "itemName": "?ㅼ씠踰??뺤궛",
          "amount": 120000,
          "vatAmount": 10000,          // null 媛??          "commissionAmount": 5000,    // null 媛??          "memo": "",
          "bankId": "bank-001",        // ?낃툑怨꾩쥖, null 媛??          "bank": {
            "id": "bank-001",
            "bankName": "援?????,
            "accountNumber": "1234567890",
            "accountHolder": "?띻만??
          }
        }
      ]
    }
  ],
  "meta": {
    "total": 3,
    "page": 1,
    "limit": 20,
    "todayTotal": 120000,             // ?ㅻ뒛 ?낃툑 ?⑷퀎 (?곷떒 ?붿빟??
    "monthTotal": 350000              // ?대쾲???낃툑 ?⑷퀎
  }
}
```

---

### 7-2. ?낃툑 ?깅줉

**`POST /income`**

```jsonc
{
  "depositDate": "2026-06-04",
  "itemName": "?ㅼ씠踰??뺤궛",
  "amount": 120000,
  "vatAmount": 10000,                // ?좏깮
  "commissionAmount": 5000,          // ?좏깮
  "memo": "",
  "bankId": "bank-001"               // ?좏깮 (?낃툑怨꾩쥖)
}
```

> 遺媛?맞룹닔?섎즺???낅젰쨌??λ쭔 ?섎ŉ, ?곷떒 吏묎퀎쨌?쒖닔??UI 諛섏쁺? 2李??덉젙.

---

### 7-3. ?낃툑 ?섏젙

**`PATCH /income/:id`**

> ?깅줉怨??숈씪 ?꾨뱶

---

### 7-4. ?낃툑 ??젣

**`DELETE /income/:id`**

---

## 8. ?곹뭹愿由?
> ?붾㈃: ?λ? > ?곹뭹愿由???(???꾪꽣 ?놁쓬, ?꾩껜 湲곗?)

### 8-1. ?곹뭹 紐⑸줉 議고쉶

**`GET /products`**

| 荑쇰━ | ?ㅻ챸 |
|------|------|
| `q` | ?곹뭹紐? SKU, 硫붾え, 移댄뀒怨좊━ 寃??|
| `active` | `true` \| `false` (?좏깮, 誘몄??????꾩껜) |
| `page` / `limit` | |

**?묐떟**

```jsonc
{
  "data": [
    {
      "id": "prd-001",
      "sku": "SKU-001",
      "name": "?섑뵆 ?곹뭹 1",
      "category": "?꾧뎄",
      "imageUrl": "https://...",
      "memo": "",
      "active": true,
      "stock": 10,
      "safetyStock": 3,
      "currentPrice": 25000,
      "createdAtIso": "2026-01-01T00:00:00Z",
      "updatedAtIso": "2026-06-04T12:00:00Z"
      // stockHistory, priceHistory???곸꽭 API?먯꽌 蹂꾨룄 議고쉶
    }
  ],
  "meta": { "total": 5, "page": 1, "limit": 20 }
}
```

---

### 8-2. ?곹뭹 ?곸꽭 議고쉶

**`GET /products/:id`**

**?묐떟**: 紐⑸줉怨??숈씪 ?꾨뱶 (?ш퀬쨌媛寃?**?대젰? 蹂꾨룄 API**)

```jsonc
{
  "data": {
    "id": "prd-001",
    "sku": "SKU-001",
    "name": "?섑뵆 ?곹뭹 1",
    "category": "?꾧뎄",
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

### 8-2-1. ?ш퀬 ?대젰

**`GET /products/:id/stock-history`**

| 荑쇰━ | ?ㅻ챸 |
|------|------|
| `page` / `limit` | ?섏씠吏 (FE 湲곕낯 limit 20) |
| `date` | ?대젰 諛쒖깮??`YYYY-MM` (?좏깮) |
| `kind` | `purchase` \| `sale` ??誘몄??????꾩껜 ?ш퀬 ?대젰 |

> FE ?덉뒪?좊━ ?? `?꾩껜`??stock + price API 蹂묐젹 議고쉶 ???듯빀 ?뺣젹, `媛寃⑹닔??? price-history留? `留ㅼ엯`/`?먮ℓ`??stock-history??`kind` ?꾨떖.

**?묐떟 ??ぉ ?덉떆**

```jsonc
{
  "id": "stk-001",
  "atIso": "2026-06-04T12:00:00Z",
  "delta": 10,
  "source": "purchase",              // purchase | sale | manual_adjust
  "vendor": "?꾨ℓ紐캚",
  "orderNo": "NV-240501-01",
  "unitPrice": 15000,
  "totalAmount": 150000,
  "reason": "留ㅼ엯 ?ш퀬諛섏쁺 (?뚮젅?대툕 ?쇨퇋??A)"
}
```

---

### 8-2-2. 媛寃??대젰

**`GET /products/:id/price-history`**

| 荑쇰━ | ?ㅻ챸 |
|------|------|
| `page` / `limit` | |
| `date` | `YYYY-MM` (?좏깮) |
| `kind` | `price_edit` ??(BE ?ㅽ럺???곕쫫) |

**?묐떟 ??ぉ ?덉떆**

```jsonc
{
  "id": "prh-001",
  "atIso": "2026-06-04T12:00:00Z",
  "price": 15000,
  "source": "purchase",              // product_register | manual_edit | purchase
  "reason": "留ㅼ엯 諛섏쁺 (?꾨ℓ紐캚)"
}
```

---

### 8-3. ?곹뭹 ?깅줉

**`POST /products`**

```jsonc
{
  "sku": "SKU-001",
  "name": "?섑뵆 ?곹뭹 1",
  "category": "?꾧뎄",               // ?좏깮 (移댄뀒怨좊━ name ?먮뒗 id)
  "imageUrl": "https://...",        // ?좏깮
  "memo": "",
  "active": true,
  "stock": 0,                       // 珥덇린 ?ш퀬
  "safetyStock": 3,
  "currentPrice": 25000
}
```

**BE 泥섎━**: 珥덇린 ?ш퀬 > 0?대㈃ stockHistory 泥???ぉ ?먮룞 ?앹꽦 (source: `product_register`)

---

### 8-4. ?곹뭹 ?섏젙

**`PATCH /products/:id`**

```jsonc
{
  "name": "?섑뵆 ?곹뭹 1 (?섏젙)",
  "category": "?꾧뎄",
  "imageUrl": "https://...",
  "memo": "",
  "active": true,
  "safetyStock": 3,
  "currentPrice": 28000            // ?댁쟾 媛믨낵 ?ㅻⅤ硫?priceHistory ?먮룞 異붽?
}
```

> `sku`???섏젙 遺덇? (蹂寃???`400` 諛섑솚 沅뚯옣)  
> 媛寃?蹂寃????묐떟??`previousPrice`, (?좏깮) `priceAmendedAtIso` ?ы븿 ??**짠15-2**

---

### 8-5. ?곹뭹 ??젣 (soft delete)

**`DELETE /products/:id`**

> ?ш퀬(`stock`) > 0 ?대㈃ `409` 諛섑솚  
> ??젣 ??`deletedAtIso` ?ㅼ젙, ?댄썑 紐⑸줉 議고쉶?먯꽌 ?쒖쇅

---

### 8-6. ?ш퀬 ?섎룞議곗젙

**`POST /products/:id/stock-adjust`**

```jsonc
{
  "action": "increase",     // increase | decrease
  "quantity": 5,
  "reason": "?ㅼ궗 議곗젙"    // ?좏깮
}
```

**BE 泥섎━**: `stock` 媛깆떊 + `stockHistory` 異붽? (source: `manual_adjust`)

---

## 9. 異쒓툑쨌?낃툑 怨꾩쥖

> ?붾㈃: 留ㅼ엯(?곹뭹쨌遺媛쨌湲고?) 異쒓툑怨꾩쥖, ?섏씡 ?낃툑怨꾩쥖 ???숈씪 `/banks` API

| API | ?ㅻ챸 |
|-----|------|
| `GET /banks` | 紐⑸줉 (soft delete ?쒖쇅) |
| `POST /banks` | `{ bankName, accountNumber, accountHolder }` |
| `PATCH /banks/:id` | ?숈씪 ?꾨뱶 ?섏젙 |
| `DELETE /banks/:id` | soft delete |

留ㅼ엯쨌?섏씡 ?쇱씤?먮뒗 `bankId` + ?깅줉 ?쒖젏 `bank` ?ㅻ깄????? 怨꾩쥖 ??젣 ?꾩뿉???ㅻ깄?룹쑝濡?紐⑸줉 ?쒖떆 媛??

---

## 10. ?먮ℓ梨꾨꼸

> ?붾㈃: 留ㅼ텧 ?깅줉 ??梨꾨꼸 ?좏깮쨌愿由?(`sale-channel-manage-dialog`)

### 10-1. ?꾩옱 (FE ?곕룞??

| API | ?ㅻ챸 |
|-----|------|
| `GET /sales-channels` | 紐⑸줉 (soft delete ?쒖쇅) |
| `POST /sales-channels` | `{ name }` |
| `PATCH /sales-channels/:id` | `{ name }` |
| `DELETE /sales-channels/:id` | soft delete |

留ㅼ텧 二쇰Ц: `channelId` + `channel` ?ㅻ깄??(`{ id, name }`).

---

### 10-2. ?뺤옣 ?붿껌 (BE 援ы쁽 ?꾩슂) ??짠14-10

> **諛곌꼍**: 梨꾨꼸留덈떎 ?뚮옯???섏닔猷뚭? ?ㅻ쫫(?ㅻ쭏?몄뒪?좎뼱쨌荑좏뙜쨌G留덉폆 ??. 遺媛??10/110)??梨꾨꼸怨?臾닿? ??**?꾩뿭 ?ㅼ젙**(`GET /settings`)?먮쭔 ?? **?섏닔猷뚮뒗 梨꾨꼸蹂?*濡?愿由?

**?꾨뱶 ?뺤쓽**

| ?꾨뱶 | ???| ?꾩닔 | ?ㅻ챸 |
|------|------|------|------|
| `name` | string | ??| 梨꾨꼸 ?쇰꺼 ??留ㅼ텧 諭껋?쨌?좏깮 紐⑸줉 (?? `?ㅻ쭏?몄뒪?좎뼱`, `荑좏뙜`) |
| `platformFeeRate` | number | ??| 異붿젙 ?쒖씡???뚮옯???섏닔猷뚯쑉 (0~1). ?? `0.0636` = 6.36% |
| `storeName` | string | ??| ?대떦 梨꾨꼸 **???곸젏紐?* (?? `OO?쇨퇋??). `name`怨?援щ텇 |
| `storeUrl` | string | ??| ?ㅽ넗?는룹??ъ꽱??URL (http/https) |

**`GET /sales-channels` ?묐떟 ?덉떆**

```jsonc
{
  "data": [
    {
      "id": "ch-001",
      "name": "?ㅻ쭏?몄뒪?좎뼱",
      "platformFeeRate": 0.0636,
      "storeName": "OO?쇨퇋??,
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
  "name": "荑좏뙜",
  "platformFeeRate": 0.108,
  "storeName": "OO?쇨퇋??,
  "storeUrl": "https://www.coupang.com/..."
}
```

**寃利?*

- `name`: trim ??鍮꾩뼱 ?덉쑝硫?`400`
- `platformFeeRate`: `0 <= rate <= 0.2` 沅뚯옣 (20% 珥덇낵 ??寃쎄퀬 ?먮뒗 ?곹븳 ?뺤쓽)
- `storeUrl`: http/https URL ?뺤떇, 鍮?臾몄옄????null
- soft delete??梨꾨꼸? 紐⑸줉쨌?좏깮?먯꽌 ?쒖쇅 (湲곗〈怨??숈씪)

**留ㅼ텧 二쇰Ц ?ㅻ깄???뺤옣**

?깅줉쨌?섏젙 ?쒖젏 梨꾨꼸 ?뺣낫瑜??ㅻ깄?룹쑝濡????(梨꾨꼸 留덉뒪??蹂寃승룹궘???꾩뿉??二쇰Ц ?대젰 ?좎?).

```jsonc
// GET /sales ?묐떟 ??channel ?ㅻ깄??{
  "channelId": "ch-001",
  "channel": {
    "id": "ch-001",
    "name": "?ㅻ쭏?몄뒪?좎뼱",
    "platformFeeRate": 0.0636,
    "storeName": "OO?쇨퇋??,
    "storeUrl": "https://smartstore.naver.com/oo-figure"
  }
}
```

> `SalesChannelSummary` ??? `id`, `name`, `platformFeeRate`, `storeName?`, `storeUrl?`

**異붿젙 ?쒖씡(`marginEstimate`) ?곕룞**

| 議곌굔 | ?섏닔猷뚯쑉 異쒖쿂 |
|------|----------------|
| `channelId` ?덇퀬 梨꾨꼸??`platformFeeRate` ?덉쓬 | ?대떦 梨꾨꼸 `platformFeeRate` |
| `channelId` ?놁쓬 | `GET /settings` ??`defaultPlatformFeeRate` (fallback, ?좏깮) |
| ?????놁쓬 | BE 湲곕낯媛?`0.0636` (?섎뱶肄붾뵫 fallback, 臾몄꽌?? |

```jsonc
// marginEstimate.assumptions ?덉떆
{
  "vatNote": "?ы븿媛 횞 10/110",
  "platformFeeNote": "寃곗젣湲덉븸 횞 6.36% (?ㅻ쭏?몄뒪?좎뼱 쨌 OO?쇨퇋??"
}
```

- `estimatedPlatformFeeAmount` = `totalAmount 횞 platformFeeRate` (二쇰Ц ?쒖젏 ?ㅻ깄??rate ?ъ슜 沅뚯옣)
- `estimatedVatAmount` = `totalAmount 횞 vatExtractRate` ??**`GET /settings.vatExtractRate`** (梨꾨꼸 臾닿?)

**FE ?곕룞 (BE 諛고룷 ??**

- 梨꾨꼸 愿由?紐⑤떖: ?깅줉쨌?섏젙 ?쇱뿉 ?섏닔猷?% ?낅젰 ???뚯닔 ???, ?곸젏紐? URL
- 紐⑸줉: `name 쨌 6.36%` ?붿빟 ?쒖떆, `storeUrl` ?덉쑝硫?留곹겕 ?꾩씠肄?- 짠14-2 ?ㅼ젙: ?꾩뿭 `platformFeeRate` **?쒓굅** ??梨꾨꼸蹂꾨줈 ?댁쟾

**留덉씠洹몃젅?댁뀡 (湲곗〈 ?곗씠??**

- 湲곗〈 `name`留??덈뒗 梨꾨꼸 ??`platformFeeRate: 0.0636` 湲곕낯媛?backfill
- `storeName`, `storeUrl` ??null

**異뷀썑 (P3, 吏湲?遺덊븘??**

- `code`: `smartstore` \| `coupang` \| ??(API ?곕룞??
- `externalStoreId`: ?뚮옯??痢??곸젏 ID

---

## 11. ?대?吏 ?낅줈??
> ?붾㈃: ?곹뭹留ㅼ엯 ?깅줉 ???곹뭹 ?대?吏

**`POST /upload`**

- `multipart/form-data`, ?꾨뱶紐?`file`
- ?대?吏留?(FE ?대씪?댁뼵??寃利? 10MB ?댄븯)
- ?묐떟 `data.url`??留ㅼ엯 `imageUrl`쨌?곹뭹 `imageUrl`???ъ슜 (R2 ??媛앹껜 ?ㅽ넗由ъ?)

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

## 12. 移댄뀒怨좊━ 愿由?
> ?붾㈃: ?곹뭹 ?깅줉/?몄쭛 紐⑤떖 ??移댄뀒怨좊━ ?좏깮 ??愿由?紐⑤떖

### 12-1. 移댄뀒怨좊━ 紐⑸줉

**`GET /categories`**

> soft delete????ぉ (`deletedAtIso != null`) ?쒖쇅

**?묐떟**

```jsonc
{
  "data": [
    { "id": "cat-001", "name": "?꾧뎄", "createdAtIso": "...", "updatedAtIso": "..." }
  ]
}
```

---

### 12-2. 移댄뀒怨좊━ ?깅줉

**`POST /categories`**

```jsonc
{ "name": "?꾧뎄" }
```

---

### 12-3. 移댄뀒怨좊━ ?섏젙

**`PATCH /categories/:id`**

```jsonc
{ "name": "?꾧뎄(?섏젙)" }
```

---

### 12-4. 移댄뀒怨좊━ ??젣

**`DELETE /categories/:id`**

> soft delete (`deletedAtIso` ?ㅼ젙)  
> ?대떦 移댄뀒怨좊━瑜??ъ슜 以묒씤 ?곹뭹??category ?꾨뱶???좎? (?대젰 蹂댁〈)

---

## 遺濡?A. 二쇱슂 ?꾨뱶 ????뺣━

| ?꾨뱶紐?| ???| 鍮꾧퀬 |
|--------|------|------|
| `id` | `string` | UUID 沅뚯옣 |
| `*Date` / `*Iso` | `string` | `YYYY-MM-DD` ?먮뒗 ISO 8601 |
| `amount` / `paymentAmount` / `totalAmount` | `number` | ??KRW), ?뺤닔 |
| `stock` / `quantity` | `number` | ?뺤닔 |
| `delta` | `number` | ?ш퀬?대젰, ?묒닔=利앷? / ?뚯닔=媛먯냼 |
| `status` | `"normal"` \| `"cancelled"` | 留ㅼ텧 二쇰Ц ?곹깭 |
| `source` (stockHistory) | `"purchase"` \| `"sale"` \| `"manual_adjust"` | |
| `source` (priceHistory) | `"product_register"` \| `"manual_edit"` \| `"purchase"` | |
| `channelId` | `string?` | 留ㅼ텧 ?먮ℓ梨꾨꼸 FK |
| `channel` | `SalesChannelSummary?` | ?깅줉 ?쒖젏 ?ㅻ깄??(`id`, `name`, `platformFeeRate`, `storeName?`, `storeUrl?`) |
| `bankId` | `string?` | 留ㅼ엯쨌?섏씡 ?쇱씤 異쒓툑/?낃툑 怨꾩쥖 FK |
| `bank` | `BankSummary?` | 怨꾩쥖 ?ㅻ깄??|

---

## 遺濡?B. FE ?곕룞 ?꾪솴 (2026-06)

| 湲곕뒫 | API | FE |
|------|-----|-----|
| ?뺤궛 異붿씠 | `GET /ledger/summary?period=` | ??|
| ????踰붿쐞 | `GET /ledger/earliest-month` | ??|
| 留ㅼ엯 3醫?| `/purchase/*` | ??|
| 援щℓ泥?| `/vendors` | ??|
| 留ㅼ텧쨌?쒖씡 異붿젙 | `/sales`, `/sales/estimate-margin` | ??|
| ?먮ℓ梨꾨꼸 | `/sales-channels` | ??(name留? / ??(짠10-2 ?뺤옣) |
| ?섏씡 | `/income`, `/banks` | ??|
| ?곹뭹쨌移댄뀒怨좊━쨌?대젰 | `/products`, `/categories`, `*-history` | ??|
| ?대?吏 ?낅줈??| `POST /upload` | ??|
| ?묒? | `GET /export/*` | ??(BE 誘몃같?????먮윭) |
| ?몄쬆 | `POST /auth/login`, `/auth/refresh` | ??|
| ?꾩뿭 寃??| `GET /ledger/search` | ??(?쒕뱶+localStorage) |
| ??쒕낫??| 誘몄젙??| ??(鍮??붾㈃) |
| ?ㅼ젙(留덉쭊쨌?섏닔猷? | 誘몄젙??| ??(鍮??붾㈃) |
| ?붾쭚 ?먭?쨌???| 誘몄젙??| ??|
| 二쇰Ц踰덊샇 以묐났 寃??| 誘몄젙??| ??|

---

## 13. 臾몄꽌 蹂댁셿 ???대? FE ?곕룞 以?(BE 援ы쁽쨌臾몄꽌???꾩슂)

> ?꾨옒??**湲곗〈 媛?대뱶???꾨씫**?섏뿀?쇰굹 FE媛 ?대? ?몄텧?섎뒗 API?낅땲?? BE 援ы쁽 ?????덉쓣 湲곗??쇰줈 留욎떠 二쇱꽭??

### 13-1. 援щℓ泥?
> ?붾㈃: ?곹뭹留ㅼ엯 ?깅줉쨌?섏젙, 援щℓ泥?愿由?紐⑤떖

| API | ?ㅻ챸 |
|-----|------|
| `GET /vendors` | 紐⑸줉 (soft delete ?쒖쇅) |
| `POST /vendors` | `{ name, link? }` |
| `PATCH /vendors/:id` | ?숈씪 ?꾨뱶 ?섏젙 |
| `DELETE /vendors/:id` | soft delete |

留ㅼ엯 ?쇱씤 body쨌?묐떟: `vendorId` (?꾩닔 沅뚯옣) + `vendorSnapshot` (`{ id, name, link }`).

?곹뭹留ㅼ엯 紐⑸줉? **寃곗젣????援щℓ泥?* 2??洹몃９:

```jsonc
// GET /purchase/products ?묐떟 洹몃９ (paymentDate ?⑥쐞)
{
  "paymentDate": "2026-06-04",
  "groupMeta": { "groupName": "...", "extraFees": [], "discounts": [], "orderCancelled": false },
  "vendorGroups": [
    {
      "vendorId": "ven-001",
      "vendorSnapshot": { "id": "ven-001", "name": "?꾨ℓ紐캚", "link": "" },
      "extraFees": [{ "id": "adj-1", "label": "諛곗넚鍮?, "amount": 3500 }],
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

| API | ?ㅻ챸 |
|-----|------|
| `PATCH /purchase/groups/vendor` | `{ paymentDate, vendorId, extraFees?, discounts? }` |
| `PATCH /purchase/groups/vendor/cancel` | `{ paymentDate, vendorId, orderCancelled }` |

---

### 13-2. 留ㅼ텧 異붿젙 ?쒖씡 (`marginEstimate`)

> ?붾㈃: 留ㅼ텧 紐⑸줉쨌?깅줉/?섏젙 紐⑤떖 ?섎떒

**紐⑸줉쨌?깅줉쨌?섏젙 ?묐떟** (`GET/POST/PATCH /sales`)??二쇰Ц蹂?`marginEstimate` ?ы븿.  
`status: "cancelled"` ??`marginEstimate: null`.

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
      "vatNote": "?ы븿媛 횞 10/110",
      "platformFeeNote": "寃곗젣湲덉븸 횞 6.36% (?ㅻ쭏?몄뒪?좎뼱 쨌 OO?쇨퇋??"
    }
  }
}
```

| ?꾨뱶 | 怨꾩궛 |
|------|------|
| `estimatedGrossProfit` | `totalAmount - estimatedCostTotal` |
| `estimatedVatAmount` | ?ы븿媛 湲곗? `횞 10/110` |
| `estimatedPlatformFeeAmount` | `totalAmount 횞 platformFeeRate` ??**二쇰Ц `channel` ?ㅻ깄??* ?먮뒗 짠10-2 fallback |
| `estimatedNetProfit` | gross ??VAT ???섏닔猷?|
| `hasUnknownCost` | ?덈ぉ ?먭?(留ㅼ엯 ?④?) 誘명솗????`true` |

**誘몃━蹂닿린**: `POST /sales/estimate-margin` ???깅줉 body? ?숈씪. body??`channelId`濡??섏닔猷뚯쑉 議고쉶.

> 遺媛?? `GET /settings` ??`vatExtractRate` (梨꾨꼸 臾닿?). ?섏닔猷? 짠10-2 梨꾨꼸蹂?`platformFeeRate`.

---

### 13-3. ?묒? ?ㅼ슫濡쒕뱶

> ?붾㈃: ?λ? 媛??????좏깮 ???곗륫

| API | 荑쇰━ | ?뚯씪 |
|-----|------|------|
| `GET /export/purchase` | `year=2026` ?먮뒗 `month=2026-06` | `留ㅼ엯_2026.xlsx` / `留ㅼ엯_2026-06.xlsx` |
| `GET /export/sales` | ?숈씪 | `留ㅼ텧_*.xlsx` |
| `GET /export/income` | ?숈씪 | `?섏씡_*.xlsx` |
| `GET /export/products` | `scope=all` \| `active` | `?곹뭹紐⑸줉_?꾩껜.xlsx` / `?곹뭹紐⑸줉_?쒖꽦.xlsx` |

- ?묐떟: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (JSON ?섑븨 ?놁쓬)
- `Content-Disposition: attachment; filename*=UTF-8''...`
- ?대떦 湲곌컙 ?곗씠???놁쓬 ??`404` + `{ error: { code: "NOT_FOUND" } }`

---

## 14. 湲곕뒫 異붽? ?붿껌 (2026-06)

> **諛곌꼍**: 1????? ?멸툑 ?좉퀬쨌?λ? ?뺣━, ?ㅼ젣 ?먮ℓ ?곹깭 ?먭???紐⑹쟻. ?ㅻ쭏?몄뒪?좎뼱 API??異뷀썑 ?곕룞 ?덉젙(?꾩옱 ?놁쓬).  
> **?곗꽑?쒖쐞**: P0(利됱떆) ??P1(?붾쭚쨌?뺤궛) ??P2(?몄쓽) ??P3(API ?곕룞 以鍮?

### ?곗꽑?쒖쐞 ?붿빟

| ?쒖쐞 | 湲곕뒫 | ?붾㈃ | ?좉퇋쨌?뺤옣 API |
|------|------|------|----------------|
| **P0** | ??쒕낫??| `/dashboard` | `GET /dashboard/overview` |
| **P0** | ?먮ℓ梨꾨꼸 ?뺤옣 | 留ㅼ텧 梨꾨꼸 愿由?| `POST/PATCH /sales-channels` ?꾨뱶 ?뺤옣 (짠10-2) |
| **P0** | 留덉쭊쨌遺媛???ㅼ젙 | `/settings` | `GET /settings`, `PATCH /settings` |
| **P1** | ?붾쭚 ?먭? 泥댄겕由ъ뒪??| ??쒕낫???먮뒗 ?λ? | `GET /ledger/monthly-review` |
| **P1** | 留ㅼ텧 ???섏씡 ???| ?λ?쨌??쒕낫??| `GET /reconciliation/sale-income` + ?섏씡 ?꾨뱶 ?뺤옣 |
| **P2** | ?λ?쨌?묒? ?⑷퀎 援먯감寃利?| ??쒕낫??| `GET /ledger/monthly-totals` (?먮뒗 monthly-review???ы븿) |
| **P2** | ?곹뭹 ?ш퀬 ?곹깭 ?꾪꽣 | ?곹뭹愿由?| `GET /products?stockStatus=` |
| **P2** | 二쇰Ц踰덊샇 以묐났 寃??| 留ㅼ텧 ?깅줉 紐⑤떖 | `GET /sales/check-order-no` |
| **P3** | ?ㅻ쭏?몄뒪?좎뼱 ?곕룞 以鍮?| ??| ?ㅽ궎留댟룹젣??(?꾨옒 짠14-8) |

---

### 14-1. [P0] ??쒕낫??吏묎퀎 ??`GET /dashboard/overview`

**紐⑹쟻**: ?쒖씠踰??????붽퀬 ?덈굹???+ ?멸툑쨌?뺤궛 ???쒕늿???뺤씤.

| ?뚮씪誘명꽣 | ?꾩닔 | 媛?|
|----------|------|-----|
| `month` | ?좏깮 | `YYYY-MM` (湲곕낯: ?ㅻ뒛 湲곗? ?대쾲 ?? |

**?묐떟**

```jsonc
{
  "data": {
    "month": "2026-06",
    "compareMonth": "2026-05",       // ?꾩썡 (?곗씠???놁쑝硫?null)
    "purchase": {
      "total": 232500,               // ?곹뭹留ㅼ엯+遺媛 (湲고?吏異??쒖쇅)
      "count": 4,
      "prevTotal": 200000,
      "changePercent": 16.25         // ?꾩썡 ?鍮?%, prev ?놁쑝硫?null
    },
    "sale": {
      "normalTotal": 120000,
      "normalCount": 5,
      "prevTotal": 126000,
      "changePercent": -4.76,
      "estimatedNetProfitTotal": 45000  // ?대떦 ???뺤긽 二쇰Ц marginEstimate.estimatedNetProfit ??    },
    "income": {
      "total": 115000,
      "count": 3,
      "prevTotal": 100000,
      "changePercent": 15
    },
    "alerts": {
      "purchaseStockPendingCount": 3,  // stockReflected=false ?곹뭹留ㅼ엯 ?쇱씤 ??      "saleUnknownCostCount": 1,       // hasUnknownCost=true ?뺤긽 二쇰Ц ??      "outOfStockCount": 2,            // active && stock<=0
      "lowStockCount": 5               // active && 0<stock<=safetyStock
    },
    "today": {
      "purchaseTotal": 0,              // ?ㅻ뒛 寃곗젣??留ㅼ엯(?곹뭹+遺媛)
      "saleTotal": 35000,                // ?ㅻ뒛 ?뺤긽 留ㅼ텧 totalAmount ??      "incomeTotal": 0,                  // ?ㅻ뒛 ?낃툑 amount ??      "stockDelta": -3                   // ?ㅻ뒛 ?ш퀬 蹂????(留ㅼ텧李④컧+留ㅼ엯諛섏쁺, ?뺤닔)
    },
    "cumulative": {
      "otherExpenseTotal": 660000,     // 湲고?吏異??꾩껜 ?꾩쟻 (period 臾닿?)
      "netTotal": -545000              // income(?대쾲?? - otherExpense(?꾩쟻), ledger/summary? ?숈씪 洹쒖튃
    }
  }
}
```

**BE 李멸퀬**

- `GET /ledger/summary`? ?좎쭨쨌吏묎퀎 洹쒖튃??**?숈씪**?섍쾶 ?좎? (留ㅼ엯 `payment_date`, 留ㅼ텧 `order_date`+`normal`, ?섏씡 `deposit_date`).
- `estimatedNetProfitTotal`: 痍⑥냼 二쇰Ц ?쒖쇅, `marginEstimate` ?놁쑝硫?0 泥섎━.

---

### 14-2. [P0] ?ъ슜???ㅼ젙 ??`GET /settings`, `PATCH /settings`

**紐⑹쟻**: 異붿쿇 ?먮ℓ媛 留덉쭊쨌遺媛???섏궛????**梨꾨꼸怨?臾닿????꾩뿭媛?* 愿由?  
?뚮옯???섏닔猷뚮뒗 **짠10-2 ?먮ℓ梨꾨꼸 `platformFeeRate`** ?먯꽌 梨꾨꼸蹂?愿由?

**?⑥씪 ?ъ슜??*: 怨꾩젙???ㅼ젙 1??(JWT `userId` 湲곗?).

**`GET /settings` ?묐떟 / `PATCH /settings` body**

```jsonc
{
  "marginMinRate": 0.15,              // 異붿쿇 ?먮ℓ媛 ?섑븳 (0~1)
  "marginMaxRate": 0.50,              // 異붿쿇 ?먮ℓ媛 ?곹븳
  "vatExtractRate": 0.0909090909,     // 遺媛???섏궛 (10/110). 梨꾨꼸 臾닿?
  "defaultPlatformFeeRate": 0.0636,   // ?좏깮: channelId ?놁쓣 ??marginEstimate fallback
  "defaultChannelId": "ch-001"        // 留ㅼ텧 ?깅줉 湲곕낯 梨꾨꼸, null 媛??}
```

**寃利?*

- `marginMinRate` ??`marginMaxRate`
- rate ?꾨뱶: 0 ?댁긽 1 ?댄븯 (`defaultPlatformFeeRate`??0~0.2 沅뚯옣)

**?곕룞 踰붿쐞**

| 湲곕뒫 | 諛섏쁺 |
|------|------|
| `marginEstimate` ??VAT | `vatExtractRate` |
| `marginEstimate` ???섏닔猷?| 二쇰Ц `channel.platformFeeRate` ???놁쑝硫?`defaultPlatformFeeRate` |
| 留ㅼ엯 異붿쿇?먮ℓ媛 | `marginMinRate`, `marginMaxRate` |
| 留ㅼ텧 ?깅줉 紐⑤떖 | `defaultChannelId` |

---

### 14-3. [P1] ?붾쭚 ?먭? ??`GET /ledger/monthly-review`

**紐⑹쟻**: ?멸툑쨌?뺤궛 ???쒕튌吏?寃꺿?泥댄겕由ъ뒪??

| ?뚮씪誘명꽣 | ?꾩닔 | 媛?|
|----------|------|-----|
| `month` | **?꾩닔** | `YYYY-MM` |

**?묐떟**

```jsonc
{
  "data": {
    "month": "2026-06",
    "checks": [
      {
        "id": "purchase_stock_pending",
        "label": "?ш퀬 誘몃컲??留ㅼ엯",
        "status": "warning",           // ok | warning | error
        "count": 3,
        "detailUrl": "/ledger?tab=purchase&purchaseSub=product&month=2026-06"
      },
      {
        "id": "sale_unknown_cost",
        "label": "?먭? 誘명솗??留ㅼ텧",
        "status": "warning",
        "count": 1
      },
      {
        "id": "sale_income_gap",
        "label": "留ㅼ텧쨌?낃툑 湲덉븸 李⑥씠",
        "status": "warning",
        "saleTotal": 120000,
        "incomeTotal": 115000,
        "diff": 5000
      },
      {
        "id": "cancelled_orders",
        "label": "痍⑥냼 泥섎━??二쇰Ц",
        "status": "ok",
        "count": 2
      }
    ],
    "items": {
      "purchaseStockPending": [
        { "id": "pp-001", "paymentDate": "2026-06-04", "productName": "...", "vendor": "?꾨ℓ紐캚" }
      ],
      "saleUnknownCost": [
        { "id": "so-002", "orderNo": "NV-...", "orderDate": "2026-06-03", "totalAmount": 32000 }
      ]
    }
  }
}
```

**?먯젙 湲곗?**

| check id | warning 議곌굔 |
|----------|----------------|
| `purchase_stock_pending` | ?대떦 ??寃곗젣??+ `stockReflected=false` ?쇱씤 1嫄??댁긽 |
| `sale_unknown_cost` | ?대떦 ??`status=normal` + `marginEstimate.hasUnknownCost=true` |
| `sale_income_gap` | `|sale.normalTotal - income.total| > 0` (?숈썡, 湲고?吏異?誘명룷?? |

---

### 14-4. [P1] 留ㅼ텧 ???섏씡 ?????`GET /reconciliation/sale-income`

**紐⑹쟻**: ?ㅻ쭏?몄뒪?좎뼱 API ?꾩뿉???쒕ℓ異쒖? ?덈뒗???낃툑 ?놁쓬 / ?낃툑留??덉쓬???섎룞 ?먭?.

| ?뚮씪誘명꽣 | ?꾩닔 | 媛?|
|----------|------|-----|
| `month` | **?꾩닔** | `YYYY-MM` |
| `channelId` | ?좏깮 | ?뱀젙 梨꾨꼸留?|

**?섏씡 ?쇱씤 ?꾨뱶 ?뺤옣 (?좏뻾)**

`income` ?깅줉쨌?섏젙 body / ?묐떟???좏깮 ?꾨뱶 異붽?:

```jsonc
{
  "orderNo": "NV-260604-12345",    // ?ㅻ쭏?몄뒪?좎뼱 二쇰Ц踰덊샇 ??(?????
  "linkedSaleOrderId": "so-001"    // 紐낆떆 ?곌껐 ??(?좏깮)
}
```

**留ㅼ묶 洹쒖튃 (?곗꽑?쒖쐞)**

1. `linkedSaleOrderId` ?쇱튂
2. ?놁쑝硫??숈썡 `orderNo` 臾몄옄???쇱튂 (留ㅼ텧 `orderNo` ???섏씡 `orderNo`)
3. 誘몃ℓ移???媛곴컖 ?쒕??곌껐??紐⑸줉???ы븿

**?묐떟**

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
      { "id": "so-003", "orderNo": "NV-...", "orderDate": "2026-06-10", "totalAmount": 5000, "channel": "?ㅻ쭏?몄뒪?좎뼱" }
    ],
    "incomeOnly": [
      { "id": "inc-002", "depositDate": "2026-06-12", "itemName": "?ㅼ씠踰??뺤궛", "amount": 3000, "orderNo": null }
    ],
    "matched": [
      { "saleOrderId": "so-001", "incomeLineId": "inc-001", "orderNo": "NV-...", "saleAmount": 52000, "incomeAmount": 48000, "diff": 4000 }
    ]
  }
}
```

---

### 14-5. [P2] ?붾퀎 ?⑷퀎 援먯감寃利???`GET /ledger/monthly-totals`

**紐⑹쟻**: ?λ? ?붾㈃쨌?묒? export ?レ옄媛 媛숈?吏 ?좉퀬 ???먭? 寃利?  
(짠14-3 `sale_income_gap`怨?以묐났 媛????**monthly-review???듯빀?대룄 臾대갑**.)

| ?뚮씪誘명꽣 | ?꾩닔 | 媛?|
|----------|------|-----|
| `month` | **?꾩닔** | `YYYY-MM` |

**?묐떟** ??`GET /export/*` 吏묎퀎? **?숈씪 洹쒖튃**?댁뼱????

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

### 14-6. [P2] ?곹뭹 ?ш퀬 ?곹깭 ?꾪꽣 ??`GET /products` ?뺤옣

**紐⑹쟻**: ?덉젅쨌?덉젅?꾨컯留?蹂닿퀬 ?먮ℓ 以?SKU 愿由?

| 荑쇰━ | ?ㅻ챸 |
|------|------|
| `stockStatus` | `out_of_stock` \| `low_stock` \| `in_stock` (蹂듭닔 comma 援щ텇 媛?? |

**?먯젙** (`active=true` 湲곗?)

| 媛?| 議곌굔 |
|----|------|
| `out_of_stock` | `stock <= 0` |
| `low_stock` | `stock > 0 && stock <= safetyStock` |
| `in_stock` | `stock > safetyStock` |

湲곗〈 `active`, `q`, `page`, `limit`? 議고빀.

---

### 14-7. [P2] 二쇰Ц踰덊샇 以묐났 寃????`GET /sales/check-order-no`

**紐⑹쟻**: ?섎룞 ?낅젰 ???숈씪 二쇰Ц ?댁쨷 ?깅줉 諛⑹? (API ?곕룞 ??.

| ?뚮씪誘명꽣 | ?꾩닔 | ?ㅻ챸 |
|----------|------|------|
| `orderNo` | **?꾩닔** | 寃?ы븷 二쇰Ц踰덊샇 (trim, ??뚮Ц??臾댁떆 沅뚯옣) |
| `excludeId` | ?좏깮 | ?섏젙 紐⑤떖 ???먭린 二쇰Ц ?쒖쇅 |

**?묐떟**

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

**?깅줉쨌?섏젙 ???쒕쾭 寃利?(沅뚯옣)**

- `POST /sales`, `PATCH /sales/:id`?먯꽌 ?숈씪 `orderNo` 議댁옱 ??`409 Conflict`  
  (`error.code`: `DUPLICATE_ORDER_NO`)

---

### 14-10. [P0] ?먮ℓ梨꾨꼸 ?꾨뱶 ?뺤옣

> **?곸꽭 ?ㅽ럺**: 짠10-2. FE??`name`留??곕룞 以???BE 諛고룷 ??愿由?紐⑤떖쨌????뺤옣.

**?붿껌 ?붿빟**

| ??ぉ | ?댁슜 |
|------|------|
| API | `GET/POST/PATCH /sales-channels` ??`platformFeeRate`, `storeName`, `storeUrl` 異붽? |
| ?ㅻ깄??| `GET /sales` ??`channel` 媛앹껜???숈씪 ?꾨뱶 ?ы븿 |
| ?쒖씡 | `marginEstimate` ?섏닔猷?= 梨꾨꼸 `platformFeeRate` (짠13-2) |
| 遺媛??| ?꾩뿭 `settings.vatExtractRate` ??梨꾨꼸 ?꾨뱶 **?놁쓬** |
| 留덉씠洹몃젅?댁뀡 | 湲곗〈 梨꾨꼸 `platformFeeRate` ??`0.0636` backfill |

**?곗꽑?쒖쐞**: ??쒕낫?쑣룹꽕?뺢낵 ?숆툒 P0 (?쒖씡 異붿젙 ?뺥솗?꾩뿉 吏곴껐).

---

### 14-8. [P3] ?ㅻ쭏?몄뒪?좎뼱 API ?곕룞 以鍮?(?ㅽ궎留덈쭔)

> 吏湲?援ы쁽 遺덊븘?? ?곕룞 ???곗씠?걔룹젣?쎈쭔 留욎떠 ?먮㈃ ??

| ??ぉ | 沅뚯옣 |
|------|------|
| `sale_orders.order_no` | UNIQUE (??젣쨌痍⑥냼 二쇰Ц ?쒖쇅 ??partial unique) |
| `sale_orders` | `externalOrderId`, `externalSource` (`smartstore`) nullable 而щ읆 ?덉빟 |
| `income_lines.order_no` | 짠14-4 ??ъ슜 |
| ?먮ℓ梨꾨꼸 | `sales_channels` ??짠10-2 `storeUrl`, `code`(`smartstore`) nullable (짠10-2 P3) |
| ?숆린??| 異뷀썑 `POST /integrations/smartstore/sync` ??蹂꾨룄 ?ㅽ럺 |

---

### 14-9. 湲곗〈 API 蹂댁셿 (?좏깮)

| API | 蹂댁셿 ?댁슜 |
|-----|-----------|
| `GET /ledger/search` | 짠2 ?ㅽ럺?濡??쒕쾭 寃??(FE ?꾩뿭 寃???곕룞 ?湲? |
| `GET /ledger/summary` | `period=month` ???꾩썡 ?鍮?`changePercent` meta 異붽? (dashboard? 以묐났 ??dashboard留?援ы쁽?대룄 ?? |
| `GET /products` | ?묐떟 meta??`outOfStockCount`, `lowStockCount` (??쒕낫??alerts? 怨듭쑀) |

---

## 15. 媛寃??섏젙 ???댁쟾 湲덉븸 ?쒖떆 (FE ?곕룞 ?덉젙)

> **紐⑹쟻**: ?곹뭹愿由?룹긽?덈ℓ?낆뿉??湲덉븸???섏젙?덉쓣 ?? FE媛  
> `~~?댁쟾湲덉븸~~` ??`?섏젙??湲덉븸` (line-through + ?좉퇋 媛? ?뺥깭濡??쒖떆?????덈룄濡?BE媛 **吏곸쟾 媛?*???대젮以??  
> **?곗꽑?쒖쐞**: P1 (?곹뭹 `currentPrice`, ?곹뭹留ㅼ엯 `paymentAmount` / ?뚯깮 ?④?)

### 15-1. ?ㅺ퀎 ?먯튃

| ?먯튃 | ?댁슜 |
|------|------|
| **?꾩옱媛?+ 吏곸쟾媛?* | 紐⑸줉쨌?곸꽭쨌PATCH ?묐떟??`current` ?꾨뱶? 吏앹씠 ?섎뒗 `previous*` ?꾨뱶瑜??붾떎 |
| **null = ?쒖떆 ????* | `previous*`媛 `null`?닿굅???꾩옱媛믨낵 媛숈쑝硫?FE??痍⑥냼?좎쓣 洹몃━吏 ?딆쓬 |
| **留덉?留?1???섏젙留?* | ?쒕챺 踰???媛寃⒱앹씠 ?꾨땲??**諛붾줈 ?댁쟾 媛?1媛?*留??좎? (?ㅽ쉶 ?섏젙 ?대젰? `price_history` ??湲곗〈 ?대젰 API) |
| **?쒕쾭 怨꾩궛** | FE?먯꽌 ?댁쟾媛믪쓣 異붾줎?섏? ?딆쓬 ??PATCH 吏곹썑쨌?덈줈怨좎묠 ?꾩뿉???숈씪?섍쾶 蹂댁씠?ㅻ㈃ BE媛 蹂닿?쨌諛섑솚 |

**FE ?쒖떆 洹쒖튃 (李멸퀬)**

```text
previousPrice != null && previousPrice !== currentPrice
  ?? <s>15,000??/s> 12,000??```

---

### 15-2. ?곹뭹愿由?(`products`)

#### ????꾨뱶

| ?꾨뱶 | ?ㅻ챸 |
|------|------|
| `currentPrice` | ?꾩옱 ?먮ℓ媛 (湲곗〈) |
| `previousPrice` | **?좉퇋** ??吏곸쟾 `currentPrice`. 媛寃⑹씠 留덉?留됱쑝濡?諛붾????좎? |

#### 媛믪쓣 ?명똿?섎뒗 ?쒖젏

| ?대깽??| `previousPrice` | `price_history` |
|--------|-----------------|-----------------|
| `POST /products` (?깅줉) | `null` | `source: product_register`, `price = currentPrice` |
| `PATCH /products/:id` ??`currentPrice` **蹂寃?* | 蹂寃???`currentPrice` ???| `source: manual_edit`, `price = ?좉퇋媛?, **`previousPrice = 蹂寃??꾧컪`** |
| `PATCH /products/:id` ??`currentPrice` **?숈씪** | 湲곗〈 `previousPrice` ?좎? | 異붽? ?놁쓬 |
| `POST .../stock-reflect` ???④?濡?`currentPrice` 媛깆떊 | 蹂寃???`currentPrice` ???| `source: purchase`, `price = ?좉퇋媛?, **`previousPrice = 蹂寃??꾧컪`** |
| `currentPrice` ???꾨뱶留??섏젙 | `previousPrice` ?좎? | 媛寃??대젰 異붽? ?놁쓬 |

#### API ?묐떟 ?뺤옣

**`GET /products`**, **`GET /products/:id`**, **`PATCH /products/:id`** ?묐떟 `data`??異붽?:

```jsonc
{
  "id": "prd-001",
  "currentPrice": 28000,
  "previousPrice": 25000,           // null 媛??  "priceAmendedAtIso": "2026-06-09T10:30:00Z"  // ?좏깮. 留덉?留?媛寃?蹂寃??쒓컖
}
```

- `priceAmendedAtIso`: FE ?꾩닔???꾨떂. ?뺣젹쨌?댄똻?⑹쑝濡?沅뚯옣.

#### 媛寃??대젰 API ?뺤옣

**`GET /products/:id/price-history`** ??ぉ??`previousPrice` 異붽? (蹂寃??대깽?몃쭔):

```jsonc
{
  "id": "prh-002",
  "atIso": "2026-06-09T10:30:00Z",
  "price": 28000,
  "previousPrice": 25000,          // ?깅줉 理쒖큹 嫄?product_register)? null
  "source": "manual_edit",           // product_register | manual_edit | purchase
  "reason": "?곹뭹 ?몄쭛"
}
```

> FE ?대젰 ?? `previousPrice`媛 ?덉쑝硫??숈씪?섍쾶 痍⑥냼??+ ?좉퇋 媛寃??쒖떆.

#### (?좏깮) 紐⑸줉??寃쎈웾 ?쒓렇

?곸꽭 ?놁씠 紐⑸줉 移대뱶留?媛깆떊???? 湲곗〈 `changeKind` / `changeFrom` ?⑦꽩??媛寃⑹뿉???????덉쓬:

```jsonc
{
  "currentPrice": 28000,
  "previousPrice": 25000,
  "changeKind": "price",             // ?좏깮
  "changeFrom": "edit"               // edit | purchase (stock_adjust???ш퀬 ?꾩슜)
}
```

- ?????덉쓣 ?뚮쭔 FE媛 ?뚭툑?≪“??쨌 ?몄쭛?섏젙??諭껋? ?쒖떆 (湲곗〈 洹쒖튃 ?좎?).

---

### 15-3. ?곹뭹留ㅼ엯 ?쇱씤 (`purchase/products`)

#### ????꾨뱶

| ?꾨뱶 | ?ㅻ챸 |
|------|------|
| `paymentAmount` | 寃곗젣湲덉븸 (湲곗〈) |
| `previousPaymentAmount` | **?좉퇋** ??吏곸쟾 `paymentAmount` |
| `quantity` | 湲곗〈 |
| `previousQuantity` | **?좉퇋** ??吏곸쟾 `quantity` (?섎웾留?諛붾?寃쎌슦 ?④? 鍮꾧탳?? |

?뚯깮 ?④???**BE媛 ?대젮二쇨굅??FE媛 怨꾩궛** ??沅뚯옣? ?묐떟??紐낆떆 ?꾨뱶 ?ы븿:

| ?꾨뱶 | 怨꾩궛 |
|------|------|
| `unitPrice` | `paymentAmount / quantity` (?뺤닔 諛섏삱由??뺤콉? 湲곗〈 FE? ?숈씪) |
| `previousUnitPrice` | `previousPaymentAmount / previousQuantity` ????以??섎굹?쇰룄 `null`?대㈃ `null` |

#### 媛믪쓣 ?명똿?섎뒗 ?쒖젏

| ?대깽??| `previousPaymentAmount` / `previousQuantity` |
|--------|--------------------------------------------------|
| `POST /purchase/products` | ????`null` |
| `PATCH /purchase/products/:id` ??湲덉븸 ?먮뒗 ?섎웾 **蹂寃?* | 蹂寃???`paymentAmount` / `quantity` ???|
| `PATCH` ??湲덉븸쨌?섎웾 **?숈씪** | 湲곗〈 `previous*` ?좎? |
| `POST .../stock-reflect` | ?쇱씤 湲덉븸? 洹몃?濡???`previous*` **蹂寃??놁쓬** (?곹뭹 留덉뒪??媛寃?蹂寃쎌? 짠15-2) |
| `DELETE .../stock-reflect` | `previous*` ?좎? |

> **?쒖빟**: `stockReflected: true` ?쇱씤? ?섏젙 遺덇?(湲곗〈 짠3-3). ?댁쟾 湲덉븸 ?꾨뱶??**誘몃컲?겶룹닔??媛??援ш컙**?먯꽌留??섎? ?덉쓬.

#### API ?묐떟 ?뺤옣

**`GET /purchase/products`**, **`PATCH /purchase/products/:id`** ??媛??쇱씤 媛앹껜:

```jsonc
{
  "id": "ppl-001",
  "quantity": 10,
  "paymentAmount": 140000,
  "previousQuantity": 10,
  "previousPaymentAmount": 150000,
  "unitPrice": 14000,
  "previousUnitPrice": 15000,
  "amountAmendedAtIso": "2026-06-09T11:00:00Z"   // ?좏깮
}
```

**FE ?쒖떆 ??(?곹뭹留ㅼ엯 紐⑸줉)**

| 而щ읆 | ?쒖떆 |
|------|------|
| 寃곗젣湲덉븸 | `~~150,000??~` `140,000?? |
| 媛쒕떦湲덉븸 | `~~15,000??~` `14,000?? |
| 理쒖쥌媛쒕떦 | 援щℓ泥?洹몃９ 諛곕텇 濡쒖쭅? 湲곗〈 FE 怨꾩궛 ?좎?. 洹몃９ ?⑷퀎媛 諛붾뚮㈃ ?대떦 ?쇱씤 `previous*`? 臾닿??????덉쓬 ??**?쇱씤 ?⑥쐞 湲덉븸쨌?④?留?* ?댁쟾媛??쒖떆 |

#### ?섏젙 ?대젰 ?뚯씠釉?(沅뚯옣)

媛먯궗쨌?붾쭚 ?먭??⑹쑝濡??쇱씤蹂??섏젙 濡쒓렇瑜??④린?ㅻ㈃:

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

- 紐⑸줉 API??**留덉?留?1嫄?*留?`previous*`濡??몄텧?대룄 ??
- ?꾩껜 ?대젰???꾩슂?섎㈃ 異뷀썑 `GET /purchase/products/:id/amendments` (P2).

---

### 15-4. DB 쨌 留덉씠洹몃젅?댁뀡

```sql
-- products
ALTER TABLE products
  ADD COLUMN previous_price INTEGER NULL,
  ADD COLUMN price_amended_at TIMESTAMPTZ NULL;

-- product_price_history (湲곗〈 ?뚯씠釉?
ALTER TABLE product_price_history
  ADD COLUMN previous_price INTEGER NULL;

-- purchase_product_lines
ALTER TABLE purchase_product_lines
  ADD COLUMN previous_payment_amount INTEGER NULL,
  ADD COLUMN previous_quantity INTEGER NULL,
  ADD COLUMN amount_amended_at TIMESTAMPTZ NULL;
```

- 湲곗〈 ?? `previous_*` = `NULL` (痍⑥냼???놁쓬).
- backfill 遺덊븘??

---

### 15-5. 鍮꾨???쨌 異뷀썑

| 援щ텇 | ?ъ쑀 |
|------|------|
| 遺媛(`purchase/supply`)쨌湲고?吏異?| 湲덉븸 ?섏젙 鍮덈룄 ??쓬 ???꾩슂 ???숈씪 ?⑦꽩?쇰줈 `previousPaymentAmount` ?뺤옣 (P2) |
| 留ㅼ텧 二쇰Ц쨌??ぉ | 二쇰Ц ?섏젙 ??diff??BE ?대? 泥섎━ 以???UI 痍⑥냼???붽뎄 ??짠15? 蹂꾨룄 ?ㅽ럺 (P2) |
| `previous*` ?곴뎄 蹂닿? | ?ㅼ쓬 ?섏젙 ??**??뼱?곌린** (吏곸쟾 1?뚮쭔). ?κ린 ?대젰? `price_history` / amendment 濡쒓렇 |

---

### 15-6. FE ?곕룞 泥댄겕由ъ뒪??(BE ?꾨즺 ??

- [ ] `types/inventory-product.ts` ??`previousPrice?`, `priceAmendedAtIso?`
- [ ] `types/purchase-product.ts` ??`previousPaymentAmount?`, `previousQuantity?`, `unitPrice?`, `previousUnitPrice?`
- [ ] `price-history` ??ぉ ??`previousPrice?`
- [ ] ?곹뭹 ?곸꽭쨌紐⑸줉쨌?곹뭹留ㅼ엯 ?쇱씤 ?뚯씠釉???怨듯넻 `AmendedAmount` UI (line-through + ?좉퇋媛?
- [ ] `normalizeProduct` / `normalizeProductPurchaseLine` ?뚯꽌 諛섏쁺

---

*v3.2 ??짠15 媛寃??섏젙 ?댁쟾媛??쒖떆 ?ㅽ럺 異붽? (2026-06-09)*  
*v3.1 ???먮ℓ梨꾨꼸 ?꾨뱶 ?뺤옣 ?붿껌 異붽? (2026-06-04)*
