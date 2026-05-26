"use client";

import { useMemo, useState } from "react";
import { ExpenseTable } from "@/component/purchases/expense-table";
import { ProductTable } from "@/component/purchases/product-table";
import { PurchaseTabs, type TabItem } from "@/component/purchases/purchase-tabs";
import { SupplyTable } from "@/component/purchases/supply-table";
import type { Product } from "@/types/product";
import type {
  ExpenseRow,
  PurchaseRow,
  PurchaseTabType,
  SupplyRow,
} from "@/types/purchase";

interface PurchaseTabProps {
  products: Product[];
  onAddProduct: (payload: {
    name: string;
    category: Product["category"];
  }) => Product;
  purchases: PurchaseRow[];
  onPurchasesChange: (rows: PurchaseRow[]) => void;
  supply: SupplyRow[];
  onSupplyChange: (rows: SupplyRow[]) => void;
  expense: ExpenseRow[];
  onExpenseChange: (rows: ExpenseRow[]) => void;
}

export function PurchaseTab({
  products,
  onAddProduct,
  purchases,
  onPurchasesChange,
  supply,
  onSupplyChange,
  expense,
  onExpenseChange,
}: PurchaseTabProps) {
  const [activeTab, setActiveTab] = useState<PurchaseTabType>("purchase");
  const [search, setSearch] = useState("");

  const tabs: TabItem[] = useMemo(
    () => [
      {
        id: "purchase",
        label: "상품 매입",
        count: purchases.length,
        badgeClassName: "bg-black",
      },
      {
        id: "supply",
        label: "부가 제품",
        count: supply.length,
        badgeClassName: "bg-black/70",
      },
      {
        id: "expense",
        label: "기타",
        count: expense.length,
        badgeClassName: "bg-black/40",
      },
    ],
    [purchases.length, supply.length, expense.length],
  );

  return (
    <div className="flex flex-col gap-4">
      <PurchaseTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tab) => {
          setActiveTab(tab);
          setSearch("");
        }}
      />

      {activeTab === "purchase" ? (
        <ProductTable
          rows={purchases}
          onChange={onPurchasesChange}
          search={search}
          onSearchChange={setSearch}
          products={products}
          onAddProduct={onAddProduct}
        />
      ) : null}

      {activeTab === "supply" ? (
        <SupplyTable
          rows={supply}
          onChange={onSupplyChange}
          search={search}
          onSearchChange={setSearch}
        />
      ) : null}

      {activeTab === "expense" ? (
        <ExpenseTable
          rows={expense}
          onChange={onExpenseChange}
          search={search}
          onSearchChange={setSearch}
        />
      ) : null}
    </div>
  );
}
