import type { PurchaseLineBankFields } from "@/types/bank-account";
import type { PurchaseLineVendorFields } from "@/types/vendor";

export interface ProductPurchaseLine
  extends PurchaseLineBankFields,
    PurchaseLineVendorFields {
  id: string;
  paymentDate: string;
  orderNo: string;
  imageUrl: string;
  productName: string;
  productLink: string;
  vendor: string;
  quantity: number;
  paymentAmount: number;
  /** BE §15 — 직전 결제금액·수량 */
  previousPaymentAmount?: number | null;
  previousQuantity?: number | null;
  /** BE 계산값 (없으면 FE에서 paymentAmount÷quantity) */
  unitPrice?: number | null;
  previousUnitPrice?: number | null;
  amountAmendedAtIso?: string | null;
  memo: string;
  stockReflected: boolean;
  /** 재고반영 시 선택한 상품관리 SKU */
  productSku?: string;
}

export interface ProductPurchaseLineInput {
  paymentDate: string;
  orderNo: string;
  imageUrl: string;
  productName: string;
  productLink: string;
  quantity: string;
  paymentAmount: string;
  memo: string;
  bankId: string;
  vendorId: string;
}

/** @param paymentDate 미지정 시 호출 측에서 `todayIso()` 등 오늘 날짜를 넘깁니다 */
export function createEmptyProductPurchaseInput(
  paymentDate?: string,
): ProductPurchaseLineInput {
  return {
    paymentDate: paymentDate ?? "",
    orderNo: "",
    imageUrl: "",
    productName: "",
    productLink: "",
    quantity: "",
    paymentAmount: "",
    memo: "",
    bankId: "",
    vendorId: "",
  };
}
