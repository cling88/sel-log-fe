"use client";

import { ProductPurchasePanel } from "@/components/ledger/purchase/product-purchase-panel";
import { OtherExpensePanel } from "@/components/ledger/purchase/other/other-expense-panel";
import { PurchaseSubTabs, usePurchaseSubTab } from "@/components/ledger/purchase/purchase-sub-tabs";
import { SupplyExpensePanel } from "@/components/ledger/purchase/supply/supply-expense-panel";

export function PurchaseTabPanel() {
  const activeSub = usePurchaseSubTab();

  return (
    <div className="flex flex-col gap-4">
      <PurchaseSubTabs />
      {activeSub === "product" ? (
        <ProductPurchasePanel />
      ) : activeSub === "supply" ? (
        <SupplyExpensePanel />
      ) : (
        <OtherExpensePanel />
      )}
    </div>
  );
}
