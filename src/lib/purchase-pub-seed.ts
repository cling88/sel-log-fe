/**
 * 매입 탭 UI 확인용 초기 데이터 (퍼블).
 * API 연동 후 제거하거나 빈 배열로 교체합니다.
 */
import { todayIso } from "@/lib/date";
import type { PurchaseGroupMeta } from "@/types/purchase-group";
import type { OtherExpenseLine } from "@/types/purchase-other";
import type { ProductPurchaseLine } from "@/types/purchase-product";
import type { SupplyExpenseLine } from "@/types/purchase-supply";

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const today = todayIso();
const yesterday = daysAgoIso(1);

/** 퍼블 목록용 샘플 상품 이미지 (public/sample-product.jpg) */
export const PUB_SAMPLE_PRODUCT_IMAGE_URL = "/sample-product.jpg";

export const PUB_SEED_PRODUCT_LINES: ProductPurchaseLine[] = [
  {
    id: "pp-seed-1",
    paymentDate: today,
    orderNo: "NV-240501-01",
    imageUrl: PUB_SAMPLE_PRODUCT_IMAGE_URL,
    productName: "플레이브 피규어 A",
    productLink: "https://example.com/product/a",
    vendor: "도매몰A",
    quantity: 10,
    paymentAmount: 150000,
    memo: "1차 입고",
    stockReflected: false,
  },
  {
    id: "pp-seed-2",
    paymentDate: today,
    orderNo: "",
    imageUrl: PUB_SAMPLE_PRODUCT_IMAGE_URL,
    productName: "아크릴 스탠드 세트",
    productLink: "",
    vendor: "도매몰A",
    quantity: 5,
    paymentAmount: 42500,
    memo: "",
    stockReflected: true,
  },
];

export const PUB_SEED_PRODUCT_GROUP_META: Record<string, PurchaseGroupMeta> = {
  [today]: {
    groupName: "매입1",
    extraFees: [
      { id: "adj-seed-extra-1", label: "배송비", amount: 3500 },
    ],
    discounts: [],
    orderCancelled: false,
  },
};

export const PUB_SEED_SUPPLY_LINES: SupplyExpenseLine[] = [
  {
    id: "se-seed-1",
    paymentDate: today,
    itemName: "골판지 박스 (중)",
    vendor: "포장재마트",
    quantity: 100,
    paymentAmount: 28000,
    memo: "",
    stockReflected: false,
  },
  {
    id: "se-seed-2",
    paymentDate: yesterday,
    itemName: "완충 랩",
    vendor: "포장재마트",
    quantity: 2,
    paymentAmount: 12000,
    memo: "2롤",
    stockReflected: true,
  },
];

export const PUB_SEED_OTHER_LINES: OtherExpenseLine[] = [
  {
    id: "oe-seed-1",
    paymentDate: today,
    itemName: "사무실 월세",
    paymentAmount: 550000,
    memo: "5월분",
  },
  {
    id: "oe-seed-2",
    paymentDate: yesterday,
    itemName: "세무 기장료",
    paymentAmount: 110000,
    memo: "",
  },
];
