import type { InventoryHistoryRow, InventorySummaryRow } from "@/types/inventory";
import type { ProductCategoryItem } from "@/types/master-data";
import type { Product } from "@/types/product";
import type {
  ProductHistoryEntry,
  ProductHistoryKind,
} from "@/types/product-history";
import type { SaleChannelItem } from "@/types/sale-channel";
import type { SaleOrder } from "@/types/sale-order";

export const INITIAL_SALE_CHANNELS: SaleChannelItem[] = [
  { id: "naver", label: "네이버" },
];

export const INITIAL_CATEGORIES: ProductCategoryItem[] = [
  { id: "goods", label: "소품/완구", skuCode: "G" },
  { id: "packaging", label: "포장재", skuCode: "P" },
  { id: "equipment", label: "촬영장비", skuCode: "E" },
  { id: "other", label: "기타", skuCode: "O" },
];

export const INITIAL_VENDORS = ["도매홍", "박스몰", "쿠팡"];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    sku: "SL-G-00001",
    name: "비누 말랑이 스퀴시",
    category: "goods",
    mainVendor: "도매홍",
    memo: "",
    latestCostPerUnit: 1650,
    recommendedPrice: 2594,
    currentStock: 40,
  },
  {
    id: "prod-2",
    sku: "SL-G-00002",
    name: "고양이 베개 스퀴시",
    category: "goods",
    mainVendor: "도매홍",
    memo: "",
    latestCostPerUnit: 2100,
    recommendedPrice: 3300,
    currentStock: 31,
  },
  {
    id: "prod-3",
    sku: "SL-G-00003",
    name: "버터 스퀴시",
    category: "goods",
    mainVendor: "박스몰",
    memo: "",
    latestCostPerUnit: 980,
    recommendedPrice: 1540,
    currentStock: 18,
  },
  {
    id: "prod-4",
    sku: "SL-G-00004",
    name: "포켓 말랑 감자",
    category: "goods",
    mainVendor: "도매홍",
    memo: "",
    latestCostPerUnit: 1200,
    recommendedPrice: 1886,
    currentStock: 25,
  },
  {
    id: "prod-5",
    sku: "SL-P-00001",
    name: "박스-A",
    category: "packaging",
    mainVendor: "박스몰",
    memo: "",
    latestCostPerUnit: 420,
    recommendedPrice: 660,
    currentStock: 80,
  },
];

export const INITIAL_PRODUCT_PURCHASE_HISTORY: ProductHistoryEntry[] = [
  {
    id: "ph-p1",
    productId: "prod-1",
    sku: "SL-G-00001",
    kind: "purchase",
    date: "2026-05-10",
    quantity: 12,
    amount: 19_800,
  },
  {
    id: "ph-p2",
    productId: "prod-1",
    sku: "SL-G-00001",
    kind: "purchase",
    date: "2026-05-12",
    quantity: 20,
    amount: 33_000,
  },
  {
    id: "ph-p3",
    productId: "prod-1",
    sku: "SL-G-00001",
    kind: "purchase",
    date: "2026-05-15",
    quantity: 5,
    amount: 8_250,
  },
  {
    id: "ph-p4",
    productId: "prod-1",
    sku: "SL-G-00001",
    kind: "purchase",
    date: "2026-05-18",
    quantity: 8,
    amount: 13_200,
  },
  {
    id: "ph-p5",
    productId: "prod-1",
    sku: "SL-G-00001",
    kind: "purchase",
    date: "2026-05-20",
    quantity: 3,
    amount: 4_950,
  },
  {
    id: "ph-p6",
    productId: "prod-1",
    sku: "SL-G-00001",
    kind: "purchase",
    date: "2026-05-21",
    quantity: 10,
    amount: 16_500,
  },
  {
    id: "ph-p7",
    productId: "prod-2",
    sku: "SL-G-00002",
    kind: "purchase",
    date: "2026-05-08",
    quantity: 15,
    amount: 31_500,
  },
  {
    id: "ph-p8",
    productId: "prod-2",
    sku: "SL-G-00002",
    kind: "purchase",
    date: "2026-05-14",
    quantity: 10,
    amount: 21_000,
  },
  {
    id: "ph-p9",
    productId: "prod-3",
    sku: "SL-G-00003",
    kind: "purchase",
    date: "2026-05-11",
    quantity: 30,
    amount: 29_400,
  },
];

export const INITIAL_PRODUCT_SALE_HISTORY: ProductHistoryEntry[] = [
  {
    id: "ph-s1",
    productId: "prod-1",
    sku: "SL-G-00001",
    kind: "sale",
    date: "2026-05-16",
    quantity: 5,
    amount: 12_970,
  },
  {
    id: "ph-s2",
    productId: "prod-1",
    sku: "SL-G-00001",
    kind: "sale",
    date: "2026-05-17",
    quantity: 3,
    amount: 7_782,
  },
  {
    id: "ph-s3",
    productId: "prod-1",
    sku: "SL-G-00001",
    kind: "sale",
    date: "2026-05-19",
    quantity: 2,
    amount: 5_188,
  },
  {
    id: "ph-s4",
    productId: "prod-1",
    sku: "SL-G-00001",
    kind: "sale",
    date: "2026-05-20",
    quantity: 4,
    amount: 10_376,
  },
  {
    id: "ph-s5",
    productId: "prod-1",
    sku: "SL-G-00001",
    kind: "sale",
    date: "2026-05-21",
    quantity: 1,
    amount: 2_594,
  },
  {
    id: "ph-s6",
    productId: "prod-1",
    sku: "SL-G-00001",
    kind: "sale",
    date: "2026-05-22",
    quantity: 6,
    amount: 15_564,
  },
  {
    id: "ph-s7",
    productId: "prod-2",
    sku: "SL-G-00002",
    kind: "sale",
    date: "2026-05-15",
    quantity: 5,
    amount: 16_500,
  },
];

export const INITIAL_SALE_ORDERS: SaleOrder[] = [
  {
    id: "order-1",
    date: "2026-05-15",
    channel: "naver",
    orderNo: "20260515-88421",
    memo: "묶음 배송",
    lines: [
      {
        id: "ol-1",
        lineType: "product",
        productId: "prod-1",
        sku: "SL-G-00001",
        productName: "비누 말랑이 스퀴시",
        salePrice: 12_000,
        vat: 1_200,
        quantity: 2,
      },
      {
        id: "ol-2",
        lineType: "product",
        productId: "prod-2",
        sku: "SL-G-00002",
        productName: "고양이 베개 스퀴시",
        salePrice: 8_000,
        vat: 800,
        quantity: 1,
      },
      {
        id: "ol-3",
        lineType: "shipping",
        amount: 3_000,
        vat: 0,
      },
      {
        id: "ol-4",
        lineType: "coupon",
        amount: 1_500,
      },
    ],
  },
  {
    id: "order-2",
    date: "2026-05-18",
    channel: "naver",
    orderNo: "20260518-12093",
    lines: [
      {
        id: "ol-5",
        lineType: "product",
        productId: "prod-1",
        sku: "SL-G-00001",
        productName: "비누 말랑이 스퀴시",
        salePrice: 5_188,
        vat: 519,
        quantity: 2,
      },
      {
        id: "ol-6",
        lineType: "shipping",
        amount: 2_500,
      },
      {
        id: "ol-7",
        lineType: "coupon",
        amount: 500,
      },
    ],
  },
  {
    id: "order-3",
    date: "2026-05-21",
    channel: "coupang",
    orderNo: "CP-99201",
    lines: [
      {
        id: "ol-8",
        lineType: "product",
        productId: "prod-3",
        sku: "SL-G-00003",
        productName: "버터 스퀴시",
        salePrice: 3_080,
        vat: 308,
        quantity: 2,
      },
    ],
  },
];

export function getProductHistory(
  productId: string,
  kind: ProductHistoryKind,
  source: ProductHistoryEntry[],
  limit = 5,
): ProductHistoryEntry[] {
  return source
    .filter((row) => row.productId === productId && row.kind === kind)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

export const INITIAL_INVENTORY_SUMMARY: InventorySummaryRow[] =
  INITIAL_PRODUCTS.map((product) => ({
    productId: product.id,
    productName: product.name,
    purchaseQty:
      product.id === "prod-1" ? 48 : product.id === "prod-2" ? 36 : 20,
    saleQty: product.id === "prod-1" ? 10 : product.id === "prod-2" ? 5 : 2,
    adjustmentQty: product.id === "prod-1" ? 2 : 0,
    currentStock: product.currentStock,
  }));

export const INITIAL_INVENTORY_HISTORY: InventoryHistoryRow[] = [
  {
    id: "ih-1",
    productId: "prod-1",
    date: "2026-05-10",
    type: "purchase",
    quantity: 12,
    reason: "매입 등록",
    source: "auto",
  },
  {
    id: "ih-2",
    productId: "prod-1",
    date: "2026-05-15",
    type: "sale",
    quantity: -5,
    reason: "매출 등록",
    source: "auto",
  },
  {
    id: "ih-3",
    productId: "prod-1",
    date: "2026-05-20",
    type: "manual",
    quantity: 2,
    unitCost: 1650,
    reason: "샘플 출고 후 재입고",
    source: "manual",
  },
  {
    id: "ih-4",
    productId: "prod-1",
    date: "2026-05-21",
    type: "manual",
    quantity: -1,
    unitCost: 1650,
    reason: "매입분 샘플 차감",
    source: "manual",
  },
];
