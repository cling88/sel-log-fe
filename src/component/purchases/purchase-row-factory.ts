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
    unitPrice: 0,
    shippingFee: null as number | null,
    discount: null as number | null,
  };
  const calc = calcPurchase({
    quantity: base.quantity,
    unitPrice: base.unitPrice,
    shippingFee: 0,
    discount: 0,
  });
  return { ...base, ...calc };
}

export function withNewId<T extends { id: string }>(row: T): T {
  return { ...row, id: `row-${globalThis.crypto?.randomUUID?.() ?? Date.now()}` };
}
