import { todayIso } from "@/lib/date";
import { createPubSeedIncomeLines } from "@/lib/income-pub-seed";
import {
  PUB_SEED_OTHER_LINES,
  PUB_SEED_PRODUCT_GROUP_META,
  PUB_SEED_PRODUCT_LINES,
  PUB_SEED_SUPPLY_LINES,
} from "@/lib/purchase-pub-seed";
import { createPubSeedSaleOrders } from "@/lib/sale-pub-seed";
import type { LedgerTabId, PurchaseSubTabId } from "@/types/common";
import type { InventoryProduct } from "@/types/inventory-product";
import type { LedgerGlobalSearchResult } from "@/types/ledger-global-search";

const PRODUCTS_STORAGE_KEY = "sellog-products-pub-v1";

const TAB_LABELS: Record<LedgerTabId, string> = {
  purchase: "매입",
  sale: "매출",
  income: "수익",
  products: "상품관리",
};

const PURCHASE_SUB_LABELS: Record<PurchaseSubTabId, string> = {
  product: "상품매입",
  supply: "부가",
  other: "기타지출",
};

function includesQuery(text: string | undefined, q: string) {
  if (!text) return false;
  return text.toLowerCase().includes(q);
}

function monthFromDate(date: string) {
  return date.slice(0, 7);
}

function loadStoredProducts(): InventoryProduct[] {
  if (typeof globalThis.localStorage === "undefined") return [];
  try {
    const raw = globalThis.localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as InventoryProduct[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function pushResult(
  results: LedgerGlobalSearchResult[],
  result: Omit<LedgerGlobalSearchResult, "tabLabel" | "subLabel"> & {
    tab: LedgerTabId;
    purchaseSub?: PurchaseSubTabId;
  },
) {
  results.push({
    ...result,
    tabLabel: TAB_LABELS[result.tab],
    subLabel: result.purchaseSub
      ? PURCHASE_SUB_LABELS[result.purchaseSub]
      : undefined,
  });
}

/** 퍼블: 시드 + localStorage 상품 기준 전역 검색 */
export function searchLedgerGlobally(query: string): LedgerGlobalSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: LedgerGlobalSearchResult[] = [];
  const today = todayIso();

  for (const line of PUB_SEED_PRODUCT_LINES) {
    const groupName =
      PUB_SEED_PRODUCT_GROUP_META[line.paymentDate]?.groupName ?? "";
    if (
      !includesQuery(line.productName, q) &&
      !includesQuery(line.vendor, q) &&
      !includesQuery(line.orderNo, q) &&
      !includesQuery(line.memo, q) &&
      !includesQuery(groupName, q) &&
      !line.paymentDate.includes(q)
    ) {
      continue;
    }
    pushResult(results, {
      id: `purchase-product-${line.id}`,
      tab: "purchase",
      purchaseSub: "product",
      month: monthFromDate(line.paymentDate),
      title: line.productName,
      subtitle: line.vendor,
      date: line.paymentDate,
    });
  }

  for (const line of PUB_SEED_SUPPLY_LINES) {
    if (
      !includesQuery(line.itemName, q) &&
      !includesQuery(line.vendor, q) &&
      !includesQuery(line.memo, q) &&
      !line.paymentDate.includes(q)
    ) {
      continue;
    }
    pushResult(results, {
      id: `purchase-supply-${line.id}`,
      tab: "purchase",
      purchaseSub: "supply",
      month: monthFromDate(line.paymentDate),
      title: line.itemName,
      subtitle: line.vendor,
      date: line.paymentDate,
    });
  }

  for (const line of PUB_SEED_OTHER_LINES) {
    if (
      !includesQuery(line.itemName, q) &&
      !includesQuery(line.memo, q) &&
      !line.paymentDate.includes(q)
    ) {
      continue;
    }
    pushResult(results, {
      id: `purchase-other-${line.id}`,
      tab: "purchase",
      purchaseSub: "other",
      month: monthFromDate(line.paymentDate),
      title: line.itemName,
      subtitle: line.memo,
      date: line.paymentDate,
    });
  }

  for (const order of createPubSeedSaleOrders(today)) {
    const itemNames = order.items.map((item) => item.productName).join(" ");
    if (
      !includesQuery(order.orderNo, q) &&
      !includesQuery(order.customerName, q) &&
      !includesQuery(itemNames, q) &&
      !includesQuery(order.memo, q) &&
      !order.orderDate.includes(q)
    ) {
      continue;
    }
    pushResult(results, {
      id: `sale-${order.id}`,
      tab: "sale",
      month: monthFromDate(order.orderDate),
      title: order.orderNo || order.customerName,
      subtitle: itemNames,
      date: order.orderDate,
    });
  }

  for (const line of createPubSeedIncomeLines(today)) {
    if (
      !includesQuery(line.itemName, q) &&
      !includesQuery(line.memo, q) &&
      !line.depositDate.includes(q)
    ) {
      continue;
    }
    pushResult(results, {
      id: `income-${line.id}`,
      tab: "income",
      month: monthFromDate(line.depositDate),
      title: line.itemName,
      subtitle: line.memo,
      date: line.depositDate,
    });
  }

  for (const product of loadStoredProducts()) {
    if (
      !includesQuery(product.name, q) &&
      !includesQuery(product.sku, q) &&
      !includesQuery(product.memo, q) &&
      !includesQuery(product.category, q)
    ) {
      continue;
    }
    pushResult(results, {
      id: `products-${product.id}`,
      tab: "products",
      title: product.name,
      subtitle: `SKU ${product.sku}`,
    });
  }

  return results.sort((a, b) => {
    if (a.date && b.date && a.date !== b.date) return b.date.localeCompare(a.date);
    return a.title.localeCompare(b.title, "ko");
  });
}
