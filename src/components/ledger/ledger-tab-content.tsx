"use client";

import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { IncomeTabPanel } from "@/components/ledger/income/income-tab-panel";
import { LedgerMonthTabs } from "@/components/ledger/ledger-month-tabs";
import { PurchaseTabPanel } from "@/components/ledger/purchase/purchase-tab-panel";
import { ProductsTabPanel } from "@/components/ledger/products/products-tab-panel";
import { SaleTabPanel } from "@/components/ledger/sale/sale-tab-panel";
import type { LedgerTabId } from "@/types/common";

function isLedgerTab(value: string | null): value is LedgerTabId {
  return (
    value === "purchase" ||
    value === "sale" ||
    value === "income" ||
    value === "products"
  );
}

export function LedgerTabContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: LedgerTabId = isLedgerTab(tabParam) ? tabParam : "purchase";

  let panel: ReactNode = null;
  if (activeTab === "purchase") panel = <PurchaseTabPanel />;
  else if (activeTab === "sale") panel = <SaleTabPanel />;
  else if (activeTab === "income") panel = <IncomeTabPanel />;
  else if (activeTab === "products") panel = <ProductsTabPanel />;

  return (
    <div className="overflow-hidden relative ">
      <LedgerMonthTabs tabId={activeTab} />
      <div className="p-4 sm:p-6 rounded-xl border border-[var(--color-text-muted)] bg-white shadow-[var(--shadow-md)] relative z-0">{panel}</div>
    </div>
  );
}
