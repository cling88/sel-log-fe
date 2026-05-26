import { calcPurchase } from "@/lib/calc";
import { todayIso } from "@/lib/date";
import type { ExpenseRow, PurchaseRow, SupplyRow } from "@/types/purchase";

export function createEmptyExpense(): ExpenseRow {
  return {
    id: "",
    date: todayIso(),
    vendor: "",
    content: "",
    amount: 0,
    memo: "",
  };
}

export function createEmptySupply(): SupplyRow {
  return {
    id: "",
    date: todayIso(),
    vendor: "",
    name: "",
    quantity: 1,
    unitPrice: null,
    totalPayment: 0,
    memo: "",
  };
}

export function createEmptyProduct(): PurchaseRow {
  const base = {
    id: "",
    productId: "",
    sku: "",
    date: todayIso(),
    vendor: "",
    name: "",
    quantity: 1,
    totalPayment: 0,
    vat: null as number | null,
    shippingFee: null as number | null,
    discount: null as number | null,
    unitPrice: 0,
  };
  const calc = calcPurchase({
    quantity: base.quantity,
    totalPayment: base.totalPayment,
  });
  return { ...base, ...calc };
}

export function withNewId<T extends { id: string }>(row: T): T {
  return { ...row, id: `row-${globalThis.crypto?.randomUUID?.() ?? Date.now()}` };
}
