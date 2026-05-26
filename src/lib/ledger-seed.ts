import { calcPurchase } from "@/lib/calc";
import type { ExpenseRow, PurchaseRow, SupplyRow } from "@/types/purchase";

function buildProductRow(
  partial: Omit<PurchaseRow, "costPerUnit" | "recommendedPrice" | "unitPrice">,
): PurchaseRow {
  const calc = calcPurchase({
    quantity: partial.quantity,
    totalPayment: partial.totalPayment,
  });
  return { ...partial, ...calc };
}

export const INITIAL_LEDGER_PURCHASES: PurchaseRow[] = [
  buildProductRow({
    id: "p1",
    productId: "prod-1",
    sku: "SL-G-00001",
    date: "2026-05-10",
    vendor: "도매홍",
    name: "비누 말랑이 스퀴시",
    quantity: 12,
    totalPayment: 19800,
    vat: 1800,
    shippingFee: null,
    discount: null,
  }),
  buildProductRow({
    id: "p2",
    productId: "prod-2",
    sku: "SL-G-00002",
    date: "2026-05-12",
    vendor: "도매홍",
    name: "고양이 베개 스퀴시",
    quantity: 20,
    totalPayment: 20800,
    vat: null,
    shippingFee: null,
    discount: null,
  }),
];

export const INITIAL_LEDGER_SUPPLY: SupplyRow[] = [
  {
    id: "s1",
    date: "2026-05-07",
    vendor: "박스몰",
    name: "택배박스 소형 50매",
    quantity: 2,
    unitPrice: 18500,
    totalPayment: 37000,
    memo: "",
  },
  {
    id: "s2",
    date: "2026-05-14",
    vendor: "박스몰",
    name: "완충 뽁뽁이 롤",
    quantity: 3,
    unitPrice: 4320,
    totalPayment: 12960,
    memo: "5월 재주문",
  },
];

export const INITIAL_LEDGER_EXPENSE: ExpenseRow[] = [
  {
    id: "e1",
    date: "2026-05-06",
    vendor: "쿠팡",
    content: "PULUZ 포토박스 12색",
    amount: 38970,
    memo: "촬영장비",
  },
  {
    id: "e2",
    date: "2026-05-08",
    vendor: "서울등록조합",
    content: "세금계산서 관련",
    amount: 40500,
    memo: "확인 필요",
  },
];
