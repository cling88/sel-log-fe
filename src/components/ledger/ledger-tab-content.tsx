"use client";

import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { IncomeTabPanel } from "@/components/ledger/income/income-tab-panel";
import { LedgerMonthTabs, LedgerMonthTabsSpacer } from "@/components/ledger/ledger-month-tabs";
import { PurchaseTabPanel } from "@/components/ledger/purchase/purchase-tab-panel";
import { ProductsTabPanel } from "@/components/ledger/products/products-tab-panel";
import { SaleTabPanel } from "@/components/ledger/sale/sale-tab-panel";
import { isMonthScopedLedgerTab } from "@/lib/ledger-period";
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

  const showMonthTabs = isMonthScopedLedgerTab(activeTab);

  return (
    <div className="overflow-hidden relative ">
      <div className="relative z-10 mb-[-1px]">
        {showMonthTabs ? (
          <LedgerMonthTabs tabId={activeTab} />
        ) : (
          <LedgerMonthTabsSpacer />
        )}
      </div>
      <div className="relative z-0 rounded-xl border border-[var(--color-text-muted)] bg-white p-4 shadow-[var(--shadow-md)] sm:p-6">
        {panel}
      </div>
    </div>
  );
}
