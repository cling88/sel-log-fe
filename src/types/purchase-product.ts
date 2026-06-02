export interface ProductPurchaseLine {
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
  };
}
