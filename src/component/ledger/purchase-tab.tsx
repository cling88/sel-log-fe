"use client";

import { useMemo, useState } from "react";
import { ExpenseTable } from "@/component/purchases/expense-table";
import { ProductTable } from "@/component/purchases/product-table";
import { PurchaseTabs, type TabItem } from "@/component/purchases/purchase-tabs";
import { SupplyTable } from "@/component/purchases/supply-table";
import { calcPurchase } from "@/lib/calc";
import type { Product } from "@/types/product";
import type {
  ExpenseRow,
  PurchaseRow,
  PurchaseTabType,
  SupplyRow,
} from "@/types/purchase";

function buildProductRow(
  partial: Omit<PurchaseRow, "totalPayment" | "costPerUnit" | "recommendedPrice">,
): PurchaseRow {
  const calc = calcPurchase({
    quantity: partial.quantity,
    unitPrice: partial.unitPrice,
    shippingFee: partial.shippingFee ?? 0,
    discount: partial.discount ?? 0,
  });
  return { ...partial, ...calc };
}

const initialPurchases: PurchaseRow[] = [
  buildProductRow({
    id: "p1",
    productId: "prod-1",
    sku: "SL-G-00001",
    date: "2026-05-10",
    vendor: "도매홍",
    name: "비누 말랑이 스퀴시",
    quantity: 12,
    unitPrice: 1650,
    shippingFee: null,
    discount: null,
  }),
  buildProductRow({
    id: "p2",
    productId: "prod-2",
    sku: "SL-G-00002",
    date: "2026-05-12",
    vendor: "도매홍",
    name: "고양이 베개 스퀴시",
    quantity: 20,
    unitPrice: 890,
    shippingFee: 3000,
    discount: null,
  }),
];

const initialSupply: SupplyRow[] = [
  {
    id: "s1",
    date: "2026-05-07",
    vendor: "박스몰",
    name: "택배박스 소형 50매",
    quantity: 2,
    unitPrice: 18500,
    totalPayment: 37000,
    memo: "",
  },
  {
    id: "s2",
    date: "2026-05-14",
    vendor: "박스몰",
    name: "완충 뽁뽁이 롤",
    quantity: 3,
    unitPrice: 4320,
    totalPayment: 12960,
    memo: "5월 재주문",
  },
];

const initialExpense: ExpenseRow[] = [
  {
    id: "e1",
    date: "2026-05-06",
    vendor: "쿠팡",
    content: "PULUZ 포토박스 12색",
    amount: 38970,
    memo: "촬영장비",
  },
  {
    id: "e2",
    date: "2026-05-08",
    vendor: "서울등록조합",
    content: "세금계산서 관련",
    amount: 40500,
    memo: "확인 필요",
  },
];

interface PurchaseTabProps {
  products: Product[];
  onAddProduct: (payload: {
    name: string;
    category: Product["category"];
  }) => Product;
}

export function PurchaseTab({ products, onAddProduct }: PurchaseTabProps) {
  const [activeTab, setActiveTab] = useState<PurchaseTabType>("purchase");
  const [search, setSearch] = useState("");
  const [purchases, setPurchases] = useState(initialPurchases);
  const [supply, setSupply] = useState(initialSupply);
  const [expense, setExpense] = useState(initialExpense);

  const tabs: TabItem[] = useMemo(
    () => [
      {
        id: "purchase",
        label: "상품 매입",
        count: purchases.length,
        badgeClassName: "bg-blue-500",
      },
      {
        id: "supply",
        label: "부가 제품",
        count: supply.length,
        badgeClassName: "bg-orange-500",
      },
      {
        id: "expense",
        label: "기타",
        count: expense.length,
        badgeClassName: "bg-zinc-400",
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
          onChange={setPurchases}
          search={search}
          onSearchChange={setSearch}
          products={products}
          onAddProduct={onAddProduct}
        />
      ) : null}

      {activeTab === "supply" ? (
        <SupplyTable
          rows={supply}
          onChange={setSupply}
          search={search}
          onSearchChange={setSearch}
        />
      ) : null}

      {activeTab === "expense" ? (
        <ExpenseTable
          rows={expense}
          onChange={setExpense}
          search={search}
          onSearchChange={setSearch}
        />
      ) : null}
    </div>
  );
}
