/** 카테고리 마스터 id (설정에서 추가·수정 가능) */
export type ProductCategoryId = string;

export interface Product {
  id: string;
  /** 내부 상품 코드 (등록 시 자동 생성, 변경 불가) */
  sku: string;
  name: string;
  category: ProductCategoryId;
  mainVendor: string;
  memo: string;
  latestCostPerUnit: number;
  recommendedPrice: number;
  currentStock: number;
}
