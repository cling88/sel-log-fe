import { ApiError, apiFetch, type ApiEnvelope } from "@/lib/api-client";
import type {
  DashboardOverview,
  LedgerMonthlyTotals,
  MonthlyReview,
  SaleIncomeReconciliation,
} from "@/types/dashboard";

export function getDashboardErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "대시보드 요청에 실패했습니다.";
}

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function nullableNum(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function nullableString(value: unknown): string | null {
  if (value == null || value === "") return null;
  return String(value);
}

export function normalizeDashboardOverview(raw: unknown): DashboardOverview {
  const row = (raw ?? {}) as Record<string, unknown>;
  const purchase = (row.purchase ?? {}) as Record<string, unknown>;
  const sale = (row.sale ?? {}) as Record<string, unknown>;
  const income = (row.income ?? {}) as Record<string, unknown>;
  const alerts = (row.alerts ?? {}) as Record<string, unknown>;
  const today = (row.today ?? {}) as Record<string, unknown>;
  const cumulative = (row.cumulative ?? {}) as Record<string, unknown>;

  return {
    month: String(row.month ?? ""),
    compareMonth: nullableString(row.compareMonth),
    purchase: {
      total: num(purchase.total),
      count: num(purchase.count),
      prevTotal: nullableNum(purchase.prevTotal),
      changePercent: nullableNum(purchase.changePercent),
    },
    sale: {
      normalTotal: num(sale.normalTotal),
      normalCount: num(sale.normalCount),
      prevTotal: nullableNum(sale.prevTotal),
      changePercent: nullableNum(sale.changePercent),
      estimatedNetProfitTotal: num(sale.estimatedNetProfitTotal),
    },
    income: {
      total: num(income.total),
      count: num(income.count),
      prevTotal: nullableNum(income.prevTotal),
      changePercent: nullableNum(income.changePercent),
    },
    alerts: {
      purchaseStockPendingCount: num(alerts.purchaseStockPendingCount),
      saleUnknownCostCount: num(alerts.saleUnknownCostCount),
      outOfStockCount: num(alerts.outOfStockCount),
      lowStockCount: num(alerts.lowStockCount),
    },
    today: {
      purchaseTotal: num(today.purchaseTotal),
      saleTotal: num(today.saleTotal),
      incomeTotal: num(today.incomeTotal),
      stockDelta: num(today.stockDelta),
    },
    cumulative: {
      otherExpenseTotal: num(cumulative.otherExpenseTotal),
      netTotal: num(cumulative.netTotal),
    },
  };
}

export function normalizeMonthlyReview(raw: unknown): MonthlyReview {
  const row = (raw ?? {}) as Record<string, unknown>;
  const items = (row.items ?? {}) as Record<string, unknown>;
  const checks = Array.isArray(row.checks) ? row.checks : [];

  return {
    month: String(row.month ?? ""),
    checks: checks.map((item) => {
      const c = (item ?? {}) as Record<string, unknown>;
      return {
        id: String(c.id ?? ""),
        label: String(c.label ?? ""),
        status: (c.status === "ok" || c.status === "error"
          ? c.status
          : "warning") as MonthlyReview["checks"][number]["status"],
        ...(c.count != null ? { count: num(c.count) } : {}),
        ...(c.saleTotal != null ? { saleTotal: num(c.saleTotal) } : {}),
        ...(c.incomeTotal != null ? { incomeTotal: num(c.incomeTotal) } : {}),
        ...(c.diff != null ? { diff: num(c.diff) } : {}),
        ...(c.detailUrl ? { detailUrl: String(c.detailUrl) } : {}),
      };
    }),
    items: {
      purchaseStockPending: Array.isArray(items.purchaseStockPending)
        ? items.purchaseStockPending.map((item) => {
            const r = (item ?? {}) as Record<string, unknown>;
            return {
              id: String(r.id ?? ""),
              paymentDate: String(r.paymentDate ?? ""),
              productName: String(r.productName ?? ""),
              vendor: String(r.vendor ?? ""),
            };
          })
        : [],
      saleUnknownCost: Array.isArray(items.saleUnknownCost)
        ? items.saleUnknownCost.map((item) => {
            const r = (item ?? {}) as Record<string, unknown>;
            return {
              id: String(r.id ?? ""),
              orderNo: String(r.orderNo ?? ""),
              orderDate: String(r.orderDate ?? ""),
              totalAmount: num(r.totalAmount),
            };
          })
        : [],
    },
  };
}

export function normalizeSaleIncomeReconciliation(
  raw: unknown,
): SaleIncomeReconciliation {
  const row = (raw ?? {}) as Record<string, unknown>;
  const summary = (row.summary ?? {}) as Record<string, unknown>;

  return {
    month: String(row.month ?? ""),
    summary: {
      saleTotal: num(summary.saleTotal),
      incomeTotal: num(summary.incomeTotal),
      matchedCount: num(summary.matchedCount),
      saleOnlyCount: num(summary.saleOnlyCount),
      incomeOnlyCount: num(summary.incomeOnlyCount),
    },
    saleOnly: Array.isArray(row.saleOnly)
      ? row.saleOnly.map((item) => {
          const r = (item ?? {}) as Record<string, unknown>;
          return {
            id: String(r.id ?? ""),
            orderNo: String(r.orderNo ?? ""),
            orderDate: String(r.orderDate ?? ""),
            totalAmount: num(r.totalAmount),
            channel: nullableString(r.channel),
          };
        })
      : [],
    incomeOnly: Array.isArray(row.incomeOnly)
      ? row.incomeOnly.map((item) => {
          const r = (item ?? {}) as Record<string, unknown>;
          return {
            id: String(r.id ?? ""),
            depositDate: String(r.depositDate ?? ""),
            itemName: String(r.itemName ?? ""),
            amount: num(r.amount),
            orderNo: nullableString(r.orderNo),
          };
        })
      : [],
    matched: Array.isArray(row.matched)
      ? row.matched.map((item) => {
          const r = (item ?? {}) as Record<string, unknown>;
          return {
            saleOrderId: String(r.saleOrderId ?? ""),
            incomeLineId: String(r.incomeLineId ?? ""),
            orderNo: String(r.orderNo ?? ""),
            saleAmount: num(r.saleAmount),
            incomeAmount: num(r.incomeAmount),
            diff: num(r.diff),
          };
        })
      : [],
  };
}

export function normalizeLedgerMonthlyTotals(raw: unknown): LedgerMonthlyTotals {
  const row = (raw ?? {}) as Record<string, unknown>;
  const purchase = (row.purchase ?? {}) as Record<string, unknown>;
  const sale = (row.sale ?? {}) as Record<string, unknown>;
  const income = (row.income ?? {}) as Record<string, unknown>;

  return {
    month: String(row.month ?? ""),
    purchase: {
      productTotal: num(purchase.productTotal),
      supplyTotal: num(purchase.supplyTotal),
      otherTotal: num(purchase.otherTotal),
      grandTotal: num(purchase.grandTotal),
    },
    sale: {
      normalTotal: num(sale.normalTotal),
      normalCount: num(sale.normalCount),
      cancelledCount: num(sale.cancelledCount),
    },
    income: {
      total: num(income.total),
      vatTotal: num(income.vatTotal),
      commissionTotal: num(income.commissionTotal),
      count: num(income.count),
    },
  };
}

/** GET /api/v1/dashboard/overview */
export async function fetchDashboardOverview(
  month?: string,
): Promise<DashboardOverview> {
  const search = month ? `?month=${encodeURIComponent(month)}` : "";
  const res = await apiFetch<ApiEnvelope<unknown>>(
    `/dashboard/overview${search}`,
  );
  return normalizeDashboardOverview(res.data);
}

/** GET /api/v1/ledger/monthly-review */
export async function fetchMonthlyReview(month: string): Promise<MonthlyReview> {
  const res = await apiFetch<ApiEnvelope<unknown>>(
    `/ledger/monthly-review?month=${encodeURIComponent(month)}`,
  );
  return normalizeMonthlyReview(res.data);
}

/** GET /api/v1/reconciliation/sale-income */
export async function fetchSaleIncomeReconciliation(
  month: string,
  channelId?: string,
): Promise<SaleIncomeReconciliation> {
  const search = new URLSearchParams({ month });
  if (channelId?.trim()) search.set("channelId", channelId.trim());
  const res = await apiFetch<ApiEnvelope<unknown>>(
    `/reconciliation/sale-income?${search}`,
  );
  return normalizeSaleIncomeReconciliation(res.data);
}

/** GET /api/v1/ledger/monthly-totals */
export async function fetchLedgerMonthlyTotals(
  month: string,
): Promise<LedgerMonthlyTotals> {
  const res = await apiFetch<ApiEnvelope<unknown>>(
    `/ledger/monthly-totals?month=${encodeURIComponent(month)}`,
  );
  return normalizeLedgerMonthlyTotals(res.data);
}
