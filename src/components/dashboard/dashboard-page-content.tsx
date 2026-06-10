"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  getDashboardErrorMessage,
  useDashboardOverview,
  useLedgerMonthlyTotals,
  useMonthlyReview,
  useSaleIncomeReconciliation,
} from "@/hooks/use-dashboard";
import { getTodayYearMonth, toYearMonthParam } from "@/lib/ledger-period";
import { formatAmount } from "@/lib/purchase-product-calc";
import { cn } from "@/lib/utils";
import type { MonthlyReviewCheckStatus } from "@/types/dashboard";
import { ChevronLeft, ChevronRight } from "lucide-react";

function formatChangePercent(value: number | null | undefined): string {
  if (value == null) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function changeClass(value: number | null | undefined): string {
  if (value == null || value === 0) return "text-[var(--color-text-muted)]";
  return value > 0 ? "text-emerald-700" : "text-[var(--color-danger)]";
}

function formatSignedAmount(value: number, suffix = "원"): string {
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${prefix}${formatAmount(Math.abs(value))}${suffix}`;
}

function CheckStatusBadge({ status }: { status: MonthlyReviewCheckStatus }) {
  const label =
    status === "ok" ? "OK" : status === "error" ? "주의" : "확인";
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium",
        status === "ok" && "bg-emerald-50 text-emerald-800",
        status === "warning" && "bg-amber-50 text-amber-800",
        status === "error" && "bg-red-50 text-red-800",
      )}
    >
      {label}
    </span>
  );
}

function StatCard({
  title,
  amount,
  sub,
  changePercent,
}: {
  title: string;
  amount: string;
  sub?: string;
  changePercent?: number | null;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-sm)]">
      <p className="text-xs text-[var(--color-text-muted)]">{title}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--color-text-primary)]">
        {amount}
      </p>
      {sub ? (
        <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{sub}</p>
      ) : null}
      <p className={cn("mt-1 text-xs tabular-nums", changeClass(changePercent))}>
        전월 대비 {formatChangePercent(changePercent)}
      </p>
    </div>
  );
}

export function DashboardPageContent() {
  const router = useRouter();
  const today = getTodayYearMonth();
  const [year, setYear] = useState(today.year);
  const [month, setMonth] = useState(today.month);
  const monthParam = toYearMonthParam(year, month);

  const overviewQuery = useDashboardOverview(monthParam);
  const reviewQuery = useMonthlyReview(monthParam);
  const reconciliationQuery = useSaleIncomeReconciliation(monthParam);
  const totalsQuery = useLedgerMonthlyTotals(monthParam);

  const data = overviewQuery.data;
  const errorMessage =
    overviewQuery.isError && overviewQuery.error
      ? getDashboardErrorMessage(overviewQuery.error)
      : null;

  const alertLinks = useMemo(() => {
    if (!data) return [];
    const links: { label: string; href: string; count: number }[] = [];
    if (data.alerts.purchaseStockPendingCount > 0) {
      links.push({
        label: "재고 미반영 매입",
        count: data.alerts.purchaseStockPendingCount,
        href: `/ledger?tab=purchase&purchaseSub=product&month=${monthParam}`,
      });
    }
    if (data.alerts.saleUnknownCostCount > 0) {
      links.push({
        label: "원가 미확인 매출",
        count: data.alerts.saleUnknownCostCount,
        href: `/ledger?tab=sale&month=${monthParam}`,
      });
    }
    if (data.alerts.outOfStockCount > 0) {
      links.push({
        label: "품절",
        count: data.alerts.outOfStockCount,
        href: `/ledger?tab=products&stockStatus=out_of_stock`,
      });
    }
    if (data.alerts.lowStockCount > 0) {
      links.push({
        label: "품절임박",
        count: data.alerts.lowStockCount,
        href: `/ledger?tab=products&stockStatus=low_stock`,
      });
    }
    return links;
  }, [data, monthParam]);

  const shiftMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    while (m < 1) {
      m += 12;
      y -= 1;
    }
    while (m > 12) {
      m -= 12;
      y += 1;
    }
    setYear(y);
    setMonth(m);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            대시보드
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => shiftMonth(-1)}
            aria-label="이전 달"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-[7rem] text-center text-sm font-medium tabular-nums">
            {year}년 {month}월
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => shiftMonth(1)}
            aria-label="다음 달"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </p>
      ) : null}

      {overviewQuery.isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">불러오는 중...</p>
      ) : data ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="매입"
              amount={`${formatAmount(data.purchase.total)}원`}
              sub={`${data.purchase.count}건`}
              changePercent={data.purchase.changePercent}
            />
            <StatCard
              title="매출 (정상)"
              amount={`${formatAmount(data.sale.normalTotal)}원`}
              sub={`${data.sale.normalCount}건`}
              changePercent={data.sale.changePercent}
            />
            <StatCard
              title="수익 (입금)"
              amount={`${formatAmount(data.income.total)}원`}
              sub={`${data.income.count}건`}
              changePercent={data.income.changePercent}
            />
            <StatCard
              title="추정 순익"
              amount={formatSignedAmount(data.sale.estimatedNetProfitTotal)}
              sub="정상 주문 합계"
            />
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-[var(--shadow-sm)]">
            <p className="text-xs font-medium text-[var(--color-text-muted)]">
              오늘
            </p>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm tabular-nums">
              <span>매입 {formatAmount(data.today.purchaseTotal)}원</span>
              <span>매출 {formatAmount(data.today.saleTotal)}원</span>
              <span>입금 {formatAmount(data.today.incomeTotal)}원</span>
              <span>재고 변동 {data.today.stockDelta}개</span>
            </div>
            <p className="mt-3 border-t border-[var(--color-border)]/80 pt-3 text-sm tabular-nums text-[var(--color-text-secondary)]">
              수익 {formatAmount(data.income.total)}원 − 누적 기타지출{" "}
              {formatAmount(data.cumulative.otherExpenseTotal)}원 ={" "}
              <span className="font-medium text-[var(--color-text-primary)]">
                {formatAmount(data.cumulative.netTotal)}원
              </span>
            </p>
          </div>

          {alertLinks.length > 0 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <p className="text-sm font-medium text-amber-900">확인 필요</p>
              <ul className="mt-2 space-y-1">
                {alertLinks.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-amber-900 underline-offset-2 hover:underline"
                    >
                      {item.label} {item.count}건
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}

      {reviewQuery.data ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            월말 점검
          </h2>
          <ul className="space-y-2">
            {reviewQuery.data.checks.map((check) => (
              <li
                key={check.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <CheckStatusBadge status={check.status} />
                  <span>{check.label}</span>
                  {check.count != null ? (
                    <span className="text-[var(--color-text-muted)]">
                      {check.count}건
                    </span>
                  ) : null}
                  {check.diff != null && check.diff !== 0 ? (
                    <span className="text-[var(--color-danger)]">
                      차이 {formatAmount(Math.abs(check.diff))}원
                    </span>
                  ) : null}
                </div>
                {check.detailUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => router.push(check.detailUrl!)}
                  >
                    보기
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {reconciliationQuery.data ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            매출 ↔ 입금 대사
          </h2>
          <div className="rounded-xl border border-[var(--color-border)] bg-white p-4 text-sm">
            <p className="tabular-nums">
              매출 {formatAmount(reconciliationQuery.data.summary.saleTotal)}원
              · 입금 {formatAmount(reconciliationQuery.data.summary.incomeTotal)}
              원
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              매칭 {reconciliationQuery.data.summary.matchedCount} · 매출만{" "}
              {reconciliationQuery.data.summary.saleOnlyCount} · 입금만{" "}
              {reconciliationQuery.data.summary.incomeOnlyCount}
            </p>
            {reconciliationQuery.data.saleOnly.length > 0 ? (
              <ul className="mt-3 space-y-1 border-t border-[var(--color-border)]/80 pt-3 text-xs">
                {reconciliationQuery.data.saleOnly.slice(0, 5).map((row) => (
                  <li key={row.id} className="text-[var(--color-text-secondary)]">
                    입금 없음 · {row.orderNo} ·{" "}
                    {formatAmount(row.totalAmount)}원
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
      ) : null}

      {totalsQuery.data ? (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            월별 합계 (엑셀 대조용)
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            매입 {formatAmount(totalsQuery.data.purchase.grandTotal)}원 · 매출{" "}
            {formatAmount(totalsQuery.data.sale.normalTotal)}원 · 입금{" "}
            {formatAmount(totalsQuery.data.income.total)}원
          </p>
        </section>
      ) : null}
    </div>
  );
}
