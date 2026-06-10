"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LedgerExcelDownloadActions } from "@/components/ledger/ledger-excel-download-actions";
import { LedgerYearPicker } from "@/components/ledger/ledger-year-picker";
import { useLedgerSummary } from "@/hooks/use-ledger-summary";
import { getLedgerErrorMessage } from "@/lib/api/ledger";
import { isMonthScopedLedgerTab } from "@/lib/ledger-period";
import { formatAmount } from "@/lib/purchase-product-calc";
import {
  applyLedgerTabParams,
  buildLedgerHref,
  isLedgerPath,
} from "@/lib/ledger-url";
import { cn } from "@/lib/utils";
import type { LedgerTabId, PeriodPreset } from "@/types/common";
import { ChevronDown, ChevronUp } from "lucide-react";

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

function formatSummaryAmount(value: number | undefined, loading: boolean) {
  if (loading || value == null) return "—";
  return `${formatAmount(value)}원`;
}

function formatNetTotal(value: number | undefined, loading: boolean) {
  if (loading || value == null) return "—";
  const prefix = value < 0 ? "-" : "";
  return `${prefix}${formatAmount(Math.abs(value))}원`;
}

export function LedgerHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: LedgerTabId = isLedgerTab(tabParam) ? tabParam : "purchase";
  const [trendExpanded, setTrendExpanded] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodPreset>("today");

  const {
    data: summary,
    isLoading: summaryLoading,
    isError: summaryError,
    error: summaryErrorValue,
  } = useLedgerSummary(selectedPeriod);

  const purchaseTotal = summary?.purchase.total ?? 0;
  const purchaseCount = summary?.purchase.count ?? 0;
  const saleTotal = summary?.sale.normalTotal ?? 0;
  const saleCount = summary?.sale.normalCount ?? 0;
  const incomeTotal = summary?.income.total ?? 0;
  const incomeCount = summary?.income.count ?? 0;
  const cumulativeOtherExpense = summary?.otherExpense.total ?? 0;
  const netTotal = summary?.netTotal ?? 0;
  const summaryPending = summaryLoading && !summary;

  if (!isLedgerPath(pathname)) return null;

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
            {periodPresets.map((preset) => {
              const active = preset.id === selectedPeriod;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPeriod(preset.id)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-white/20 text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white",
                  )}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
          {summaryError ? (
            <p className="mt-3 text-xs text-red-200">
              {getLedgerErrorMessage(summaryErrorValue)}
            </p>
          ) : null}
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              {
                label: "매입",
                subLabel: summaryPending
                  ? "—"
                  : `상품+공급비 ${purchaseCount}건`,
                amount: formatSummaryAmount(purchaseTotal, summaryPending),
              },
              {
                label: "매출 (정상)",
                subLabel: summaryPending ? "—" : `${saleCount}건`,
                amount: formatSummaryAmount(saleTotal, summaryPending),
              },
              {
                label: "수익 (입금)",
                subLabel: summaryPending ? "—" : `${incomeCount}건`,
                amount: formatSummaryAmount(incomeTotal, summaryPending),
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur"
              >
                <p className="text-xs text-white/70">{item.label}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {item.amount}
                </p>
                <p className="mt-0.5 text-xs text-white/60">{item.subLabel}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 text-right text-sm text-white/80">
            <p>
              수익 입금{" "}
              <span className="font-semibold text-white">
                {formatSummaryAmount(incomeTotal, summaryPending)}
              </span>
            </p>
            <p>
              - 누적 기타지출{" "}
              <span className="font-semibold text-white">
                {formatSummaryAmount(cumulativeOtherExpense, summaryPending)}
              </span>
            </p>
            <p>
              = 총{" "}
              <span className="font-semibold text-white">
                {formatNetTotal(netTotal, summaryPending)}
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
        <LedgerYearPicker interactive={isMonthScopedLedgerTab(activeTab)} />
      </div>

      <nav className="flex items-end justify-between gap-3 bg-[var(--primary-900)] px-4 pb-0 pt-2 sm:px-6">
        <div className="flex min-w-0 gap-4 overflow-x-auto">
          {ledgerTabs.map((tab) => {
            const active = tab.id === activeTab;
            const href = buildLedgerHref(pathname, searchParams, (params) => {
              applyLedgerTabParams(params, tab.id);
            });
            return (
              <Link
                key={tab.id}
                href={href}
                replace
                scroll={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "shrink-0 border-b-2 px-1 pb-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-white text-white"
                    : "border-transparent text-white/50 hover:text-white/80",
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        <LedgerExcelDownloadActions tabId={activeTab} />
      </nav>
    </div>
  );
}
