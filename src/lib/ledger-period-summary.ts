import { summarizeSaleOrder } from "@/lib/sale-order-calc";
import type { InventoryHistoryRow } from "@/types/inventory";
import type { Product } from "@/types/product";
import type { ExpenseRow, PurchaseRow, SupplyRow } from "@/types/purchase";
import type { SaleOrder } from "@/types/sale-order";

export interface ManualAdjustmentLine {
  id: string;
  date: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  amount: number;
  reason: string;
}

export interface MonthLedgerSummary {
  purchaseTotal: number;
  saleTotal: number;
  addStockTotal: number;
  subtractStockTotal: number;
  finalTotal: number;
  addLines: ManualAdjustmentLine[];
  subtractLines: ManualAdjustmentLine[];
}

function isInMonth(isoDate: string, year: number, month: number): boolean {
  const [y, m] = isoDate.split("-").map(Number);
  return y === year && m === month;
}

function manualLineAmount(row: InventoryHistoryRow): number {
  const unit = row.unitCost ?? 0;
  return Math.round(unit * Math.abs(row.quantity));
}

export function computeMonthLedgerSummary({
  year,
  month,
  purchases,
  supply,
  expense,
  saleOrders,
  inventoryHistory,
  products,
}: {
  year: number;
  month: number;
  purchases: PurchaseRow[];
  supply: SupplyRow[];
  expense: ExpenseRow[];
  saleOrders: SaleOrder[];
  inventoryHistory: InventoryHistoryRow[];
  products: Product[];
}): MonthLedgerSummary {
  const productNameById = new Map(products.map((p) => [p.id, p.name]));

  const purchaseTotal =
    purchases
      .filter((r) => isInMonth(r.date, year, month))
      .reduce((sum, r) => sum + r.totalPayment, 0) +
    supply
      .filter((r) => isInMonth(r.date, year, month))
      .reduce((sum, r) => sum + r.totalPayment, 0) +
    expense
      .filter((r) => isInMonth(r.date, year, month))
      .reduce((sum, r) => sum + r.amount, 0);

  const saleTotal = saleOrders
    .filter((o) => isInMonth(o.date, year, month))
    .reduce((sum, o) => sum + summarizeSaleOrder(o, products).totalPaid, 0);

  const manualInMonth = inventoryHistory.filter(
    (row) => row.type === "manual" && isInMonth(row.date, year, month),
  );

  const addLines: ManualAdjustmentLine[] = [];
  const subtractLines: ManualAdjustmentLine[] = [];

  for (const row of manualInMonth) {
    const amount = manualLineAmount(row);
    const line: ManualAdjustmentLine = {
      id: row.id,
      date: row.date,
      productId: row.productId,
      productName: productNameById.get(row.productId) ?? "—",
      quantity: row.quantity,
      unitCost: row.unitCost ?? 0,
      amount,
      reason: row.reason,
    };
    if (row.quantity > 0) addLines.push(line);
    else if (row.quantity < 0) subtractLines.push(line);
  }

  const addStockTotal = addLines.reduce((sum, l) => sum + l.amount, 0);
  const subtractStockTotal = subtractLines.reduce((sum, l) => sum + l.amount, 0);

  const finalTotal =
    -purchaseTotal + saleTotal + addStockTotal - subtractStockTotal;

  return {
    purchaseTotal,
    saleTotal,
    addStockTotal,
    subtractStockTotal,
    finalTotal,
    addLines,
    subtractLines,
  };
}
