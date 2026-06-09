import type { LedgerTabId, PurchaseSubTabId } from "@/types/common";

export interface LedgerGlobalSearchResult {
  id: string;
  tab: LedgerTabId;
  purchaseSub?: PurchaseSubTabId;
  /** 원본 PK — P2 행 포커스용 */
  entityId: string;
  /** YYYY-MM — 상품관리 등 월 탭 없는 경우 생략 */
  month?: string;
  tabLabel: string;
  subLabel?: string;
  title: string;
  subtitle?: string;
  date?: string;
}
