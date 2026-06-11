import type { LedgerCumulativeExpense } from "@/lib/api/ledger";

export type DashboardOverview = {
  month: string;
  compareMonth: string | null;
  purchase: {
    total: number;
    count: number;
    prevTotal: number | null;
    changePercent: number | null;
  };
  sale: {
    normalTotal: number;
    normalCount: number;
    prevTotal: number | null;
    changePercent: number | null;
    estimatedNetProfitTotal: number;
  };
  income: {
    total: number;
    count: number;
    prevTotal: number | null;
    changePercent: number | null;
  };
  alerts: {
    purchaseStockPendingCount: number;
    saleUnknownCostCount: number;
    outOfStockCount: number;
    lowStockCount: number;
  };
  today: {
    purchaseTotal: number;
    saleTotal: number;
    incomeTotal: number;
    stockDelta: number;
  };
  cumulative: {
    /** 레거시 — 기타지출만 누적 */
    otherExpenseTotal: number;
    netTotal: number;
    /** 전체 기간 상품+부가+기타 누적 (BE 권장) */
    cumulativeExpense?: LedgerCumulativeExpense;
  };
};

export type MonthlyReviewCheckStatus = "ok" | "warning" | "error";

export type MonthlyReviewCheck = {
  id: string;
  label: string;
  status: MonthlyReviewCheckStatus;
  count?: number;
  saleTotal?: number;
  incomeTotal?: number;
  diff?: number;
  detailUrl?: string;
};

export type MonthlyReview = {
  month: string;
  checks: MonthlyReviewCheck[];
  items: {
    purchaseStockPending: Array<{
      id: string;
      paymentDate: string;
      productName: string;
      vendor: string;
    }>;
    saleUnknownCost: Array<{
      id: string;
      orderNo: string;
      orderDate: string;
      totalAmount: number;
    }>;
  };
};

export type SaleIncomeReconciliation = {
  month: string;
  summary: {
    saleTotal: number;
    incomeTotal: number;
    matchedCount: number;
    saleOnlyCount: number;
    incomeOnlyCount: number;
  };
  saleOnly: Array<{
    id: string;
    orderNo: string;
    orderDate: string;
    totalAmount: number;
    channel: string | null;
  }>;
  incomeOnly: Array<{
    id: string;
    depositDate: string;
    itemName: string;
    amount: number;
    orderNo: string | null;
  }>;
  matched: Array<{
    saleOrderId: string;
    incomeLineId: string;
    orderNo: string;
    saleAmount: number;
    incomeAmount: number;
    diff: number;
  }>;
};

export type LedgerMonthlyTotals = {
  month: string;
  purchase: {
    productTotal: number;
    supplyTotal: number;
    otherTotal: number;
    grandTotal: number;
  };
  sale: {
    normalTotal: number;
    normalCount: number;
    cancelledCount: number;
  };
  income: {
    total: number;
    vatTotal: number;
    commissionTotal: number;
    count: number;
  };
};

export type ProductStockStatus = "out_of_stock" | "low_stock" | "in_stock";
