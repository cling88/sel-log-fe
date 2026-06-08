"use client";

import { useQuery } from "@tanstack/react-query";
import { ProductPurchasePanel } from "@/components/ledger/purchase/product-purchase-panel";
import { OtherExpensePanel } from "@/components/ledger/purchase/other/other-expense-panel";
import { PurchaseSubTabs, usePurchaseSubTab } from "@/components/ledger/purchase/purchase-sub-tabs";
import { SupplyExpensePanel } from "@/components/ledger/purchase/supply/supply-expense-panel";
import { BANKS_QUERY_KEY } from "@/hooks/use-banks";
import { fetchBanks } from "@/lib/api/banks";

export function PurchaseTabPanel() {
  const activeSub = usePurchaseSubTab();

  useQuery({
    queryKey: BANKS_QUERY_KEY,
    queryFn: fetchBanks,
    staleTime: 60_000,
  });

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
