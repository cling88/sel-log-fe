import type { PurchaseLineBankFields } from "@/types/bank-account";

export interface ProductPurchaseLine extends PurchaseLineBankFields {
  id: string;
  paymentDate: string;
  orderNo: string;
  imageUrl: string;
  productName: string;
  productLink: string;
  vendor: string;
  quantity: number;
  paymentAmount: number;
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
  vendor: string;
  quantity: string;
  paymentAmount: string;
  memo: string;
  bankId: string;
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
    vendor: "",
    quantity: "",
    paymentAmount: "",
    memo: "",
    bankId: "",
  };
}
