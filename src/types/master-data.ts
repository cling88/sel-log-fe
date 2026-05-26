/** 상품 카테고리 (SKU 코드 접두와 1:1) */
export interface ProductCategoryItem {
  id: string;
  label: string;
  /** SKU용 1글자 코드 — 예: G → SL-G-00001 */
  skuCode: string;
}
