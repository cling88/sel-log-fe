import type { PurchaseLineBankFields } from "@/types/bank-account";
import type { PurchaseLineVendorFields } from "@/types/vendor";
import type {
  PurchaseDateGroupTotals,
  PurchaseGroupAdjustment,
  PurchaseGroupMeta,
} from "@/types/purchase-group";
import type { VendorSummary } from "@/types/vendor";

export interface SupplyExpenseLine
  extends PurchaseLineBankFields,
    PurchaseLineVendorFields {
  id: string;
  paymentDate: string;
  itemName: string;
  vendor: string;
  quantity: number;
  paymentAmount: number;
  memo: string;
  stockReflected: boolean;
  /** 재고반영 후 표시용 */
  productSku?: string;
  /** 재고반영 당시 수량 (라인 quantity와 다를 수 있음) */
  reflectedQty?: number;
}

export interface SupplyExpenseLineInput {
  paymentDate: string;
  itemName: string;
  quantity: string;
  paymentAmount: string;
  memo: string;
  bankId: string;
  vendorId: string;
}

export function createEmptySupplyExpenseInput(
  paymentDate?: string,
): SupplyExpenseLineInput {
  return {
    paymentDate: paymentDate ?? "",
    itemName: "",
    quantity: "1",
    paymentAmount: "",
    memo: "",
    bankId: "",
    vendorId: "",
  };
}

export type SupplyVendorGroup = {
  vendorId: string | null;
  vendorSnapshot: VendorSummary | null;
  extraFees: PurchaseGroupAdjustment[];
  discounts: PurchaseGroupAdjustment[];
  orderCancelled: boolean;
  subtotal: number;
  lines: SupplyExpenseLine[];
};

export const SUPPLY_VENDOR_NONE_KEY = "__none__";

export function supplyVendorGroupKey(vendorId: string | null): string {
  return vendorId ?? SUPPLY_VENDOR_NONE_KEY;
}

export type SupplyDateGroup = {
  paymentDate: string;
  groupName: string | null;
  orderCancelled: boolean;
  vendorGroups: SupplyVendorGroup[];
  totals: PurchaseDateGroupTotals;
};
