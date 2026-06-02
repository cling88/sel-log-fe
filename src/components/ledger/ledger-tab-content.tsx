"use client";

import { useSearchParams } from "next/navigation";
import { LedgerEmptyState } from "@/components/ledger/empty-state";
import { PurchaseTabPanel } from "@/components/ledger/purchase/purchase-tab-panel";
import type { LedgerTabId } from "@/types/common";

function isLedgerTab(value: string | null): value is LedgerTabId {
  return (
    value === "purchase" ||
    value === "sale" ||
    value === "income" ||
    value === "products"
  );
}

const emptyConfig: Record<
  Exclude<LedgerTabId, "purchase">,
  { title: string; actionLabel: string }
> = {
  sale: { title: "매출", actionLabel: "+ 매출 등록하기" },
  income: { title: "수익", actionLabel: "+ 수익 등록하기" },
  products: { title: "상품관리", actionLabel: "+ 상품 등록하기" },
};

export function LedgerTabContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: LedgerTabId = isLedgerTab(tabParam) ? tabParam : "purchase";

  if (activeTab === "purchase") {
    return <PurchaseTabPanel />;
  }

  const config = emptyConfig[activeTab];
  return (
    <LedgerEmptyState
      title={config.title}
      actionLabel={config.actionLabel}
    />
  );
}
