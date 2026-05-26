"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PeriodSelector } from "@/component/common/period-selector";
import { InventoryTab } from "@/component/ledger/inventory-tab";
import {
  LedgerTabs,
  type LedgerTabType,
} from "@/component/ledger/ledger-tabs";
import { LedgerSummaryBoard } from "@/component/ledger/ledger-summary-board";
import { PurchaseTab } from "@/component/ledger/purchase-tab";
import { SaleTab } from "@/component/ledger/sale-tab";
import { todayIso } from "@/lib/date";
import { INITIAL_PRODUCTS } from "@/lib/pub-seed";
import { createProduct } from "@/lib/product-factory";
import { useMasterData } from "@/context/master-data-context";
import type { Product } from "@/types/product";

function isLedgerTab(value: string | null): value is LedgerTabType {
  return value === "purchase" || value === "sale" || value === "inventory";
}

export function LedgerView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: LedgerTabType = isLedgerTab(tabParam) ? tabParam : "purchase";

  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);
  const { categories } = useMasterData();
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  const periodLabel = `${year}년 ${month}월`;
  const todayLabel = todayIso().replace(/-/g, ".");

  const setTab = (tab: LedgerTabType) => {
    router.replace(`/ledger?tab=${tab}`);
  };

  const shiftMonth = (delta: number) => {
    let nextMonth = month + delta;
    let nextYear = year;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    } else if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    setMonth(nextMonth);
    setYear(nextYear);
  };

  const handleAddProduct = useCallback(
    (payload: { name: string; category: string; mainVendor?: string }) => {
      const created = createProduct(products, categories, {
        ...payload,
        mainVendor: payload.mainVendor,
        withLedgerDefaults: true,
      });
      setProducts((prev) => [...prev, created]);
      return created;
    },
    [products, categories],
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          장부
        </h1>
        <PeriodSelector
          label={periodLabel}
          onPrev={() => shiftMonth(-1)}
          onNext={() => shiftMonth(1)}
        />
      </div>

      <LedgerSummaryBoard
        periodLabel={periodLabel}
        todayLabel={todayLabel}
      />

      <LedgerTabs activeTab={activeTab} onChange={setTab} />

      {activeTab === "purchase" ? (
        <PurchaseTab products={products} onAddProduct={handleAddProduct} />
      ) : null}

      {activeTab === "sale" ? (
        <SaleTab products={products} onAddProduct={handleAddProduct} />
      ) : null}

      {activeTab === "inventory" ? <InventoryTab /> : null}
    </div>
  );
}
