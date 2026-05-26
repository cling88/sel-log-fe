"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PeriodSelector } from "@/component/common/period-selector";
import { InventoryTab } from "@/component/ledger/inventory-tab";
import {
  LedgerTabs,
  type LedgerTabType,
} from "@/component/ledger/ledger-tabs";
import { LedgerSummaryBoard } from "@/component/ledger/ledger-summary-board";
import { PurchaseTab } from "@/component/ledger/purchase-tab";
import {
  SaleChannelTabs,
  type SaleChannelFilter,
} from "@/component/ledger/sale-channel-tabs";
import { SaleTab } from "@/component/ledger/sale-tab";
import { todayIso } from "@/lib/date";
import { computeMonthLedgerSummary } from "@/lib/ledger-period-summary";
import {
  INITIAL_LEDGER_EXPENSE,
  INITIAL_LEDGER_PURCHASES,
  INITIAL_LEDGER_SUPPLY,
} from "@/lib/ledger-seed";
import { createProduct } from "@/lib/product-factory";
import {
  INITIAL_INVENTORY_HISTORY,
  INITIAL_PRODUCTS,
  INITIAL_SALE_CHANNELS,
  INITIAL_SALE_ORDERS,
} from "@/lib/pub-seed";
import type { SaleChannelItem } from "@/types/sale-channel";
import { useMasterData } from "@/context/master-data-context";
import type { InventoryHistoryRow } from "@/types/inventory";
import type { Product } from "@/types/product";
import type { ExpenseRow, PurchaseRow, SupplyRow } from "@/types/purchase";
import type { SaleOrder } from "@/types/sale-order";

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

  const [purchases, setPurchases] = useState<PurchaseRow[]>(INITIAL_LEDGER_PURCHASES);
  const [supply, setSupply] = useState<SupplyRow[]>(INITIAL_LEDGER_SUPPLY);
  const [expense, setExpense] = useState<ExpenseRow[]>(INITIAL_LEDGER_EXPENSE);
  const [saleOrders, setSaleOrders] = useState<SaleOrder[]>(INITIAL_SALE_ORDERS);
  const [inventoryHistory, setInventoryHistory] = useState<InventoryHistoryRow[]>(
    INITIAL_INVENTORY_HISTORY,
  );
  const [saleChannels, setSaleChannels] =
    useState<SaleChannelItem[]>(INITIAL_SALE_CHANNELS);
  const [saleChannelFilter, setSaleChannelFilter] =
    useState<SaleChannelFilter>("all");

  const periodLabel = `${year}년 ${month}월`;
  const todayLabel = todayIso().replace(/-/g, ".");

  const monthSummary = useMemo(
    () =>
      computeMonthLedgerSummary({
        year,
        month,
        purchases,
        supply,
        expense,
        saleOrders,
        inventoryHistory,
        products,
      }),
    [
      year,
      month,
      purchases,
      supply,
      expense,
      saleOrders,
      inventoryHistory,
      products,
    ],
  );

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
        <h1 className="text-2xl font-semibold tracking-tight text-black">
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
        monthSummary={monthSummary}
      />

      <div className="flex flex-col gap-3">
        <LedgerTabs activeTab={activeTab} onChange={setTab} />

        {activeTab === "sale" ? (
          <SaleChannelTabs
            channels={saleChannels}
            activeFilter={saleChannelFilter}
            onFilterChange={setSaleChannelFilter}
            onChannelsChange={setSaleChannels}
            orderCountByChannel={(channelId) =>
              saleOrders.filter((order) => order.channel === channelId).length
            }
            totalOrderCount={saleOrders.length}
          />
        ) : null}

        {activeTab === "purchase" ? (
          <PurchaseTab
            products={products}
            onAddProduct={handleAddProduct}
            purchases={purchases}
            onPurchasesChange={setPurchases}
            supply={supply}
            onSupplyChange={setSupply}
            expense={expense}
            onExpenseChange={setExpense}
          />
        ) : null}

        {activeTab === "sale" ? (
          <SaleTab
            products={products}
            onAddProduct={handleAddProduct}
            orders={saleOrders}
            onOrdersChange={setSaleOrders}
            channels={saleChannels}
            channelFilter={saleChannelFilter}
          />
        ) : null}

        {activeTab === "inventory" ? (
          <InventoryTab
            products={products}
            history={inventoryHistory}
            onHistoryChange={setInventoryHistory}
          />
        ) : null}
      </div>
    </div>
  );
}
