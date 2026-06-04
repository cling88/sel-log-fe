import type { LedgerTabId, PurchaseSubTabId } from "@/types/common";

export interface LedgerGlobalSearchResult {
  id: string;
  tab: LedgerTabId;
  purchaseSub?: PurchaseSubTabId;
  /** YYYY-MM — 상품관리 등 월 탭 없는 경우 생략 */
  month?: string;
  tabLabel: string;
  subLabel?: string;
  title: string;
  subtitle?: string;
  date?: string;
}
