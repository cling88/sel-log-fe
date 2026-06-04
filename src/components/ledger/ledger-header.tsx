"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LedgerYearPicker } from "@/components/ledger/ledger-year-picker";
import { cn } from "@/lib/utils";
import type { LedgerTabId, PeriodPreset } from "@/types/common";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  PUB_SEED_OTHER_LINES,
  PUB_SEED_PRODUCT_LINES,
  PUB_SEED_SUPPLY_LINES,
} from "@/lib/purchase-pub-seed";
import { createPubSeedSaleOrders } from "@/lib/sale-pub-seed";
import { createPubSeedIncomeLines } from "@/lib/income-pub-seed";
import { todayIso } from "@/lib/date";
import { formatAmount } from "@/lib/purchase-product-calc";

const periodPresets: { id: PeriodPreset; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "year", label: "올해" },
  { id: "month", label: "이번달" },
  { id: "week", label: "주간" },
  { id: "today", label: "오늘" },
];

const ledgerTabs: { id: LedgerTabId; label: string }[] = [
  { id: "purchase", label: "매입" },
  { id: "sale", label: "매출" },
  { id: "income", label: "수익" },
  { id: "products", label: "상품관리" },
];

function isLedgerTab(value: string | null): value is LedgerTabId {
  return (
    value === "purchase" ||
    value === "sale" ||
    value === "income" ||
    value === "products"
  );
}

export function LedgerHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: LedgerTabId = isLedgerTab(tabParam) ? tabParam : "purchase";
  const [trendExpanded, setTrendExpanded] = useState(true);

  // 정산 추이: 각 탭 데이터 전체 최종값 합산 (퍼블 시드 기준)
  const purchaseTotal =
    PUB_SEED_PRODUCT_LINES.reduce((s, l) => s + l.paymentAmount, 0) +
    PUB_SEED_SUPPLY_LINES.reduce((s, l) => s + l.paymentAmount, 0);
  const purchaseCount = PUB_SEED_PRODUCT_LINES.length + PUB_SEED_SUPPLY_LINES.length;

  const seedSaleOrders = createPubSeedSaleOrders(todayIso());
  const normalSaleOrders = seedSaleOrders.filter((o) => o.status === "normal");
  const saleTotal = normalSaleOrders.reduce((s, o) => s + o.totalAmount, 0);
  const saleCount = normalSaleOrders.length;

  const seedIncomeLines = createPubSeedIncomeLines(todayIso());
  const incomeTotal = seedIncomeLines.reduce((s, l) => s + l.amount, 0);
  const incomeCount = seedIncomeLines.length;

  const cumulativeOtherExpense = PUB_SEED_OTHER_LINES.reduce(
    (sum, line) => sum + line.paymentAmount,
    0,
  );
  const totalAfterOtherExpense = incomeTotal - cumulativeOtherExpense;

  const setTab = (tab: LedgerTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    if (tab === "purchase") {
      if (!params.get("purchaseSub")) {
        params.set("purchaseSub", "product");
      }
    } else {
      params.delete("purchaseSub");
    }
    router.replace(`/ledger?${params.toString()}`);
  };

  if (pathname !== "/ledger") return null;

  return (
    <div className="flex flex-col">
      {trendExpanded ? (
        <section className="relative bg-[var(--primary-800)] px-4 py-4 pr-12 text-[var(--color-text-inverse)] sm:px-6 sm:pr-14">
          <button
            type="button"
            onClick={() => setTrendExpanded(false)}
            className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:top-4 sm:right-4"
            aria-label="정산 추이 접기"
            aria-expanded
          >
            <ChevronUp className="size-5" />
          </button>
          <div className="flex flex-wrap gap-2">
            {periodPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                label: "매입",
                subLabel: `상품+공급비 ${purchaseCount}건`,
                amount: purchaseTotal,
              },
              {
                label: "매출 (정상)",
                subLabel: `${saleCount}건`,
                amount: saleTotal,
              },
              {
                label: "수익 (입금)",
                subLabel: `${incomeCount}건`,
                amount: incomeTotal,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur"
              >
                <p className="text-xs text-white/70">{item.label}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {formatAmount(item.amount)}원
                </p>
                <p className="mt-0.5 text-xs text-white/60">{item.subLabel}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 text-right text-sm text-white/80">
            <p>
              수익 입금{" "}
              <span className="font-semibold text-white">
                {formatAmount(incomeTotal)}원
              </span>
            </p>
            <p>
              - 누적 기타지출{" "}
              <span className="font-semibold text-white">
                {formatAmount(cumulativeOtherExpense)}원
              </span>
            </p>
            <p>
              = 총{" "}
              <span className="font-semibold text-white">
                {totalAfterOtherExpense >= 0 ? "" : "-"}
                {formatAmount(Math.abs(totalAfterOtherExpense))}원
              </span>
            </p>
          </div>
        </section>
      ) : (
        <section className="flex items-center justify-between bg-[var(--primary-800)] px-4 py-3 text-[var(--color-text-inverse)] sm:px-6">
          <span className="text-sm font-semibold text-white">정산 추이</span>
          <button
            type="button"
            onClick={() => setTrendExpanded(true)}
            className="flex size-8 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="정산 추이 펼치기"
            aria-expanded={false}
          >
            <ChevronDown className="size-5" />
          </button>
        </section>
      )}

      <div className="border-b border-[var(--color-border-dark)] bg-[var(--primary-900)] px-4 sm:px-6">
        <LedgerYearPicker />
      </div>

      <nav className="flex gap-4 bg-[var(--primary-900)] px-4 pb-0 pt-2 sm:px-6">
        {ledgerTabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={cn(
                "border-b-2 px-1 pb-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-white text-white"
                  : "border-transparent text-white/50 hover:text-white/80",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
