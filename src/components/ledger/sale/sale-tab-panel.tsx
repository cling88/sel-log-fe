"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import { useLedgerUrlSearch } from "@/hooks/use-ledger-url-search";
import { MODAL_DIALOG_FOOTER_CLASS } from "@/components/common/modal-footer-classes";
import { LedgerEmptyState } from "@/components/ledger/empty-state";
import {
  LedgerListShell,
  ledgerListBodyClass,
  ledgerListFooterClass,
} from "@/components/ledger/ledger-list-shell";
import { SaleOrderList } from "@/components/ledger/sale/sale-order-list";
import { PurchaseListPagination } from "@/components/ledger/purchase/purchase-list-pagination";
import { PurchaseListToolbar } from "@/components/ledger/purchase/purchase-list-toolbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { todayIso } from "@/lib/date";
import { formatAmount } from "@/lib/purchase-product-calc";
import { paginate } from "@/lib/purchase-list-filters";
import { createPubSeedSaleOrders } from "@/lib/sale-pub-seed";
import type { InventoryProduct, InventoryStockHistoryItem } from "@/types/inventory-product";
import type { SaleOrder, SaleOrderAdjustment, SaleOrderItem } from "@/types/sale";
import { SALE_CHANNELS } from "@/types/sale";

const SALE_PAGE_SIZE = 8;
const PRODUCTS_STORAGE_KEY = "sellog-products-pub-v1";

function newOrderId() {
  return `so-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
}

interface SaleOrderItemInput {
  productId: string;
  quantity: number;
  lineAmount: number;
  unitPrice: number;
}

interface SaleOrderFormInput {
  orderDate: string;
  orderNo: string;
  customerName: string;
  channel: string;
  items: SaleOrderItemInput[];
  extraAdjustments: SaleOrderAdjustment[];
  discountAdjustments: SaleOrderAdjustment[];
  memo?: string;
}

function createEmptyItem(): SaleOrderItemInput {
  return {
    productId: "",
    quantity: 1,
    lineAmount: 0,
    unitPrice: 0,
  };
}

function createEmptyAdjustment(): SaleOrderAdjustment {
  return {
    id: `adj-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
    label: "",
    amount: 0,
  };
}

function createEmptyInput(): SaleOrderFormInput {
  return {
    orderDate: todayIso(),
    orderNo: "",
    customerName: "",
    channel: "",
    items: [createEmptyItem()],
    extraAdjustments: [],
    discountAdjustments: [],
    memo: "",
  };
}

interface SaleRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editOrder?: SaleOrder | null;
  products: InventoryProduct[];
  getSuggestedUnitPrice: (productId: string) => number;
  onSave: (input: SaleOrderFormInput) => void | Promise<void>;
  onUpdate: (orderId: string, input: SaleOrderFormInput) => void | Promise<void>;
}

function SaleRegisterDialog({
  open,
  onOpenChange,
  editOrder,
  products,
  getSuggestedUnitPrice,
  onSave,
  onUpdate,
}: SaleRegisterDialogProps) {
  const { alert } = useAppDialog();
  const isEdit = !!editOrder;
  const [form, setForm] = useState<SaleOrderFormInput>(createEmptyInput);

  useEffect(() => {
    if (!open) return;
    if (editOrder) {
      setForm({
        orderDate: editOrder.orderDate,
        orderNo: editOrder.orderNo,
        customerName: editOrder.customerName,
        channel: editOrder.channel ?? "",
        items: editOrder.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          lineAmount: item.lineAmount,
          unitPrice:
            item.quantity > 0
              ? Math.round(item.lineAmount / item.quantity)
              : getSuggestedUnitPrice(item.productId),
        })),
        extraAdjustments:
          editOrder.extraAdjustments?.length > 0
            ? editOrder.extraAdjustments
            : editOrder.extraAmount > 0
              ? [{ ...createEmptyAdjustment(), label: "배송비", amount: editOrder.extraAmount }]
              : [],
        discountAdjustments:
          editOrder.discountAdjustments?.length > 0
            ? editOrder.discountAdjustments
            : editOrder.discountAmount > 0
              ? [{ ...createEmptyAdjustment(), label: "쿠폰", amount: editOrder.discountAmount }]
              : [],
        memo: editOrder.memo ?? "",
      });
      return;
    }
    setForm(createEmptyInput());
  }, [open, editOrder]);

  const patch = (p: Partial<SaleOrderFormInput>) => {
    setForm((prev) => ({ ...prev, ...p }));
  };
  const patchItem = (index: number, p: Partial<SaleOrderItemInput>) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, ...p } : item)),
    }));
  };
  const addItem = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, createEmptyItem()] }));
  };
  const removeItem = (index: number) => {
    setForm((prev) => ({
      ...prev,
      items:
        prev.items.length <= 1
          ? [createEmptyItem()]
          : prev.items.filter((_, i) => i !== index),
    }));
  };
  const updateAdjustment = (
    key: "extraAdjustments" | "discountAdjustments",
    id: string,
    patchValue: Partial<SaleOrderAdjustment>,
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].map((item) =>
        item.id === id ? { ...item, ...patchValue } : item,
      ),
    }));
  };
  const addAdjustment = (key: "extraAdjustments" | "discountAdjustments") => {
    setForm((prev) => ({ ...prev, [key]: [...prev[key], createEmptyAdjustment()] }));
  };
  const removeAdjustment = (
    key: "extraAdjustments" | "discountAdjustments",
    id: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].filter((item) => item.id !== id),
    }));
  };

  const itemsAmount = form.items.reduce(
    (sum, item) => sum + Math.max(0, Number(item.lineAmount) || 0),
    0,
  );
  const extraAmount = form.extraAdjustments.reduce(
    (sum, item) => sum + Math.max(0, Number(item.amount) || 0),
    0,
  );
  const discountAmount = form.discountAdjustments.reduce(
    (sum, item) => sum + Math.max(0, Number(item.amount) || 0),
    0,
  );
  const totalAmount = Math.max(
    0,
    itemsAmount + extraAmount - discountAmount,
  );

  const submit = async () => {
    const orderNo = form.orderNo.trim();
    const customerName = form.customerName.trim();
    if (!orderNo || !customerName) {
      await alert("주문번호, 주문자명을 입력해 주세요.");
      return;
    }
    if (form.items.length === 0) {
      await alert("상품 행을 1개 이상 추가해 주세요.");
      return;
    }

    const normalizedItems = form.items
      .map((item) => ({
        productId: item.productId,
        quantity: Math.max(1, Number(item.quantity) || 1),
        lineAmount: Math.max(0, Number(item.lineAmount) || 0),
        unitPrice: Math.max(0, Number(item.unitPrice) || 0),
      }))
      .filter((item) => !!item.productId);

    if (normalizedItems.length === 0) {
      await alert("상품을 1개 이상 선택해 주세요.");
      return;
    }

    const invalid = normalizedItems.find((item) => item.quantity <= 0);
    if (invalid) {
      await alert("수량은 1개 이상이어야 합니다.");
      return;
    }

    const nextInput: SaleOrderFormInput = {
      ...form,
      orderNo,
      customerName,
      items: normalizedItems,
      extraAdjustments: form.extraAdjustments
        .map((item) => ({ ...item, label: item.label.trim(), amount: Math.max(0, item.amount) }))
        .filter((item) => item.amount > 0),
      discountAdjustments: form.discountAdjustments
        .map((item) => ({ ...item, label: item.label.trim(), amount: Math.max(0, item.amount) }))
        .filter((item) => item.amount > 0),
      memo: form.memo?.trim() || "",
    };

    if (isEdit && editOrder) {
      await onUpdate(editOrder.id, nextInput);
    } else {
      await onSave(nextInput);
    }
    onOpenChange(false);
    await alert(isEdit ? "매출이 저장되었습니다." : "매출이 등록되었습니다.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
        aria-describedby={undefined}
      >
        <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4">
          <DialogTitle>{isEdit ? "매출 수정" : "매출 등록"}</DialogTitle>
          <DialogDescription>주문 확정 건을 수동으로 기록합니다.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sale-date">주문일</Label>
              <Input
                id="sale-date"
                type="date"
                value={form.orderDate}
                onChange={(e) => patch({ orderDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sale-order-no">주문번호</Label>
              <Input
                id="sale-order-no"
                value={form.orderNo}
                onChange={(e) => patch({ orderNo: e.target.value })}
                placeholder="예: SO-20260602-001"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sale-customer">주문자명</Label>
              <Input
                id="sale-customer"
                value={form.customerName}
                onChange={(e) => patch({ customerName: e.target.value })}
                placeholder="예: 홍길동"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sale-channel">판매채널</Label>
              <select
                id="sale-channel"
                value={form.channel}
                onChange={(e) => patch({ channel: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">선택 안 함</option>
                {SALE_CHANNELS.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label>주문항목</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  + 상품 행 추가
                </Button>
              </div>
              <div className="space-y-2 rounded-lg border border-[var(--color-border)] p-3">
                {form.items.map((item, index) => (
                  <div
                    key={`item-${index}`}
                    className="grid grid-cols-1 gap-2 sm:grid-cols-12"
                  >
                    <select
                      value={item.productId}
                      onChange={(e) => {
                        const nextProductId = e.target.value;
                        const suggestedUnitPrice = nextProductId
                          ? getSuggestedUnitPrice(nextProductId)
                          : 0;
                        const nextQty = Math.max(1, Number(item.quantity) || 1);
                        patchItem(index, {
                          productId: nextProductId,
                          unitPrice: suggestedUnitPrice,
                          lineAmount: suggestedUnitPrice * nextQty,
                        });
                      }}
                      className="h-9 rounded-md border border-[var(--color-border)] bg-white px-3 text-sm sm:col-span-6"
                    >
                      <option value="">상품 선택</option>
                      {products
                        .filter((p) => !p.deletedAtIso)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.sku} | {p.name} (재고 {p.stock}개)
                          </option>
                        ))}
                    </select>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => {
                        const nextQty = Math.max(1, Number(e.target.value) || 1);
                        patchItem(index, {
                          quantity: nextQty,
                          lineAmount:
                            item.unitPrice > 0 ? item.unitPrice * nextQty : item.lineAmount,
                        });
                      }}
                      className="sm:col-span-2"
                      placeholder="수량"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={item.lineAmount}
                      onChange={(e) => {
                        const nextLineAmount = Math.max(0, Number(e.target.value) || 0);
                        const nextQty = Math.max(1, Number(item.quantity) || 1);
                        patchItem(index, {
                          lineAmount: nextLineAmount,
                          unitPrice:
                            nextQty > 0 ? Math.round(nextLineAmount / nextQty) : item.unitPrice,
                        });
                      }}
                      className="sm:col-span-3"
                      placeholder="상품금액"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-9 sm:col-span-1"
                      onClick={() => removeItem(index)}
                      title="행 삭제"
                    >
                      삭제
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>추가금액</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addAdjustment("extraAdjustments")}
                >
                  + 추가
                </Button>
              </div>
              <div className="space-y-2 rounded-lg border border-[var(--color-border)] p-2">
                {form.extraAdjustments.length === 0 ? (
                  <p className="px-1 py-1 text-xs text-[var(--color-text-muted)]">없음</p>
                ) : (
                  form.extraAdjustments.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2">
                      <Input
                        value={item.label}
                        onChange={(e) =>
                          updateAdjustment("extraAdjustments", item.id, { label: e.target.value })
                        }
                        placeholder="예: 배송비"
                        className="col-span-6 h-8"
                      />
                      <Input
                        type="number"
                        min={0}
                        value={item.amount || ""}
                        onChange={(e) =>
                          updateAdjustment("extraAdjustments", item.id, {
                            amount: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        placeholder="0"
                        className="col-span-4 h-8"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="col-span-2 h-8"
                        onClick={() => removeAdjustment("extraAdjustments", item.id)}
                      >
                        삭제
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>할인금액</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addAdjustment("discountAdjustments")}
                >
                  + 추가
                </Button>
              </div>
              <div className="space-y-2 rounded-lg border border-[var(--color-border)] p-2">
                {form.discountAdjustments.length === 0 ? (
                  <p className="px-1 py-1 text-xs text-[var(--color-text-muted)]">없음</p>
                ) : (
                  form.discountAdjustments.map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-2">
                      <Input
                        value={item.label}
                        onChange={(e) =>
                          updateAdjustment("discountAdjustments", item.id, {
                            label: e.target.value,
                          })
                        }
                        placeholder="예: 쿠폰"
                        className="col-span-6 h-8"
                      />
                      <Input
                        type="number"
                        min={0}
                        value={item.amount || ""}
                        onChange={(e) =>
                          updateAdjustment("discountAdjustments", item.id, {
                            amount: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        placeholder="0"
                        className="col-span-4 h-8"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="col-span-2 h-8"
                        onClick={() => removeAdjustment("discountAdjustments", item.id)}
                      >
                        삭제
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>총 주문금액 (자동계산)</Label>
              <div className="flex h-9 items-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm font-semibold tabular-nums">
                {formatAmount(totalAmount)}원
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="sale-memo">비고</Label>
              <Textarea
                id="sale-memo"
                rows={3}
                value={form.memo ?? ""}
                onChange={(e) => patch({ memo: e.target.value })}
                placeholder="메모, 특이사항 등"
              />
            </div>
          </div>
        </div>

        <DialogFooter className={MODAL_DIALOG_FOOTER_CLASS}>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button type="button" onClick={() => void submit()}>
            {isEdit ? "저장" : "등록"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SaleTabPanel() {
  const { alert, confirm } = useAppDialog();
  const [orders, setOrders] = useState<SaleOrder[]>(() =>
    createPubSeedSaleOrders(todayIso()),
  );
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const { search, setSearch } = useLedgerUrlSearch();
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOrderId, setEditOrderId] = useState<string | null>(null);

  const editOrder = orders.find((o) => o.id === editOrderId) ?? null;
  const visibleProducts = useMemo(
    () => products.filter((p) => !p.deletedAtIso),
    [products],
  );
  const suggestedUnitPriceByProductId = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((product) => {
      if (product.deletedAtIso) return;
      map.set(product.id, Math.max(0, Number(product.currentPrice) || 0));
    });
    return map;
  }, [products]);

  useEffect(() => {
    const raw = globalThis.localStorage?.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as InventoryProduct[];
      if (Array.isArray(parsed)) setProducts(parsed);
    } catch {
      // ignore parse failure
    }
  }, []);

  const persistProducts = (next: InventoryProduct[]) => {
    setProducts(next);
    globalThis.localStorage?.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(next));
  };

  const toQtyMap = (items: { productId: string; quantity: number }[]) => {
    const map = new Map<string, number>();
    for (const item of items) {
      const prev = map.get(item.productId) ?? 0;
      map.set(item.productId, prev + item.quantity);
    }
    return map;
  };

  const canDeductStock = (items: { productId: string; quantity: number }[]): boolean => {
    const map = toQtyMap(items);
    for (const [productId, qty] of map.entries()) {
      const target = products.find((p) => p.id === productId && !p.deletedAtIso);
      if (!target || target.stock < qty) return false;
    }
    return true;
  };

  const applyStock = (
    prev: InventoryProduct[],
    items: { productId: string; quantity: number }[],
    delta: number,
    reason: string,
  ): InventoryProduct[] => {
    const map = toQtyMap(items);
    return prev.map((p) => {
      const qty = map.get(p.id);
      if (!qty) return p;
      const nextStock = p.stock + delta * qty;
      const nextHistory: InventoryStockHistoryItem = {
        id: `stk-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
        atIso: new Date().toISOString(),
        delta: delta * qty,
        source: "sale",
        reason,
      };
      return {
        ...p,
        stock: Math.max(0, nextStock),
        updatedAtIso: new Date().toISOString(),
        stockHistory: [nextHistory, ...p.stockHistory],
      };
    });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) =>
      [
        o.orderNo,
        o.customerName,
        o.items.map((item) => item.productName).join(" "),
        o.memo ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [orders, search]);

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        if (a.orderDate !== b.orderDate) return b.orderDate.localeCompare(a.orderDate);
        return b.id.localeCompare(a.id);
      }),
    [filtered],
  );

  const { items: pagedOrders, totalPages, page: safePage } = useMemo(
    () => paginate(sorted, page, SALE_PAGE_SIZE),
    [sorted, page],
  );

  const today = todayIso();
  const monthPrefix = today.slice(0, 7);
  const todaySales = useMemo(
    () =>
      orders
        .filter((o) => o.orderDate === today && o.status === "normal")
        .reduce((sum, o) => sum + o.totalAmount, 0),
    [orders, today],
  );
  const monthSales = useMemo(
    () =>
      orders
        .filter((o) => o.orderDate.startsWith(monthPrefix) && o.status === "normal")
        .reduce((sum, o) => sum + o.totalAmount, 0),
    [orders, monthPrefix],
  );

  const openRegister = () => {
    setEditOrderId(null);
    setDialogOpen(true);
  };

  const openEdit = (orderId: string) => {
    setEditOrderId(orderId);
    setDialogOpen(true);
  };

  const toggleCancel = async (order: SaleOrder) => {
    const nextStatus = order.status === "normal" ? "cancelled" : "normal";
    const ok = await confirm({
      title: nextStatus === "cancelled" ? "주문 취소 처리" : "주문 취소 해제",
      message:
        nextStatus === "cancelled"
          ? "이 주문을 취소 상태로 변경할까요?"
          : "이 주문을 정상 상태로 변경할까요?",
      confirmLabel: "적용",
      destructive: nextStatus === "cancelled",
    });
    if (!ok) return;

    if (nextStatus === "normal" && !canDeductStock(order.items)) {
      await alert("재고가 부족해서 취소 해제할 수 없습니다.");
      return;
    }

    if (nextStatus === "cancelled") {
      persistProducts(
        applyStock(
          products,
          order.items,
          1,
          `매출 취소 복구 (${order.orderNo})`,
        ),
      );
    } else {
      persistProducts(
        applyStock(
          products,
          order.items,
          -1,
          `매출 차감 (${order.orderNo})`,
        ),
      );
    }

    setOrders((prev) =>
      prev.map((item) =>
        item.id === order.id ? { ...item, status: nextStatus } : item,
      ),
    );
    await alert(nextStatus === "cancelled" ? "취소 처리되었습니다." : "정상 처리되었습니다.");
  };

  const removeOrder = async (order: SaleOrder) => {
    if (order.status !== "cancelled") {
      await alert("삭제하려면 먼저 취소 처리해 주세요.");
      return;
    }

    const ok = await confirm({
      title: "매출 삭제",
      message: "이 매출 내역을 삭제할까요?",
      confirmLabel: "삭제",
      destructive: true,
    });
    if (!ok) return;

    // 도달 시점에 status === "cancelled" 보장됨 (위 guard)
    // 재고는 취소처리(toggleCancel) 시 이미 복구됨

    setOrders((prev) => prev.filter((o) => o.id !== order.id));
    await alert("삭제되었습니다.");
  };

  const hasOrders = orders.length > 0;
  const canRegisterSale = visibleProducts.length > 0;
  const handleOpenRegister = async () => {
    if (!canRegisterSale) {
      await alert("상품관리에서 상품을 먼저 등록해 주세요.");
      return;
    }
    openRegister();
  };

  return (
    <>
      <div className="mb-4 grid grid-cols-1 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] sm:grid-cols-2">
        <div className="border-b border-[var(--color-border)] p-4 sm:border-b-0 sm:border-r">
          <p className="text-xs text-[var(--color-text-secondary)]">오늘 매출</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatAmount(todaySales)}원
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs text-[var(--color-text-secondary)]">이번달 매출</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatAmount(monthSales)}원
          </p>
        </div>
      </div>

      {!hasOrders ? (
        <LedgerEmptyState
          title="매출"
          description={
            canRegisterSale
              ? "주문 확정 건을 등록해 매출을 관리하세요."
              : "상품관리에서 상품을 먼저 등록해 주세요."
          }
          actionLabel={canRegisterSale ? "+ 매출 등록하기" : "상품 먼저 등록 필요"}
          onAction={() => void handleOpenRegister()}
        />
      ) : (
        <LedgerListShell>
          <PurchaseListToolbar
            embedded
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            searchPlaceholder="주문번호, 주문자명, 상품명 검색"
            registerLabel="+ 매출 등록"
            onRegister={() => void handleOpenRegister()}
          />
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">
              검색 결과가 없습니다.
            </p>
          ) : (
            <>
              <div className={ledgerListBodyClass}>
                <SaleOrderList
                  orders={pagedOrders}
                  onEdit={openEdit}
                  onToggleCancel={toggleCancel}
                  onRemove={removeOrder}
                />
              </div>
              <div className={ledgerListFooterClass}>
                <PurchaseListPagination
                  page={safePage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </LedgerListShell>
      )}

      <SaleRegisterDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditOrderId(null);
        }}
        editOrder={editOrder}
        products={visibleProducts}
        getSuggestedUnitPrice={(productId) =>
          suggestedUnitPriceByProductId.get(productId) ?? 0
        }
        onSave={(input) => {
          if (!canDeductStock(input.items)) {
            void alert("재고가 부족합니다. 수량을 확인해 주세요.");
            return;
          }
          persistProducts(
            applyStock(
              products,
              input.items,
              -1,
              `매출 차감 (${input.orderNo})`,
            ),
          );
          const snapshotItems: SaleOrderItem[] = input.items.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            return {
              productId: item.productId,
              productSku: product?.sku ?? "",
              productName: product?.name ?? "",
              quantity: item.quantity,
              lineAmount: item.lineAmount,
            };
          });
          const totalAmount = Math.max(
            0,
            snapshotItems.reduce((sum, item) => sum + item.lineAmount, 0) +
              input.extraAdjustments.reduce((sum, item) => sum + item.amount, 0) -
              input.discountAdjustments.reduce((sum, item) => sum + item.amount, 0),
          );
          setOrders((prev) => [
            ...prev,
            {
              id: newOrderId(),
              orderDate: input.orderDate,
              orderNo: input.orderNo,
              customerName: input.customerName,
              channel: input.channel || undefined,
              items: snapshotItems,
              extraAdjustments: input.extraAdjustments,
              discountAdjustments: input.discountAdjustments,
              extraAmount: input.extraAdjustments.reduce((sum, item) => sum + item.amount, 0),
              discountAmount: input.discountAdjustments.reduce((sum, item) => sum + item.amount, 0),
              totalAmount,
              memo: input.memo,
              status: "normal",
            },
          ]);
        }}
        onUpdate={(orderId, input) => {
          const target = orders.find((o) => o.id === orderId);
          if (!target) return;

          let nextProducts = products;
          if (target.status === "normal") {
            nextProducts = applyStock(
              nextProducts,
              target.items,
              1,
              `매출 수정 복구 (${target.orderNo})`,
            );
            const map = new Map<string, number>();
            input.items.forEach((item) => {
              map.set(item.productId, (map.get(item.productId) ?? 0) + item.quantity);
            });
            const insufficient = [...map.entries()].some(([productId, qty]) => {
              const product = nextProducts.find((p) => p.id === productId);
              return !product || product.stock < qty;
            });
            if (insufficient) {
              void alert("재고가 부족해서 수정할 수 없습니다.");
              return;
            }
            nextProducts = applyStock(
              nextProducts,
              input.items,
              -1,
              `매출 수정 차감 (${input.orderNo})`,
            );
          }
          persistProducts(nextProducts);

          const snapshotItems: SaleOrderItem[] = input.items.map((item) => {
            const product = nextProducts.find((p) => p.id === item.productId);
            return {
              productId: item.productId,
              productSku: product?.sku ?? "",
              productName: product?.name ?? "",
              quantity: item.quantity,
              lineAmount: item.lineAmount,
            };
          });
          const totalAmount = Math.max(
            0,
            snapshotItems.reduce((sum, item) => sum + item.lineAmount, 0) +
              input.extraAdjustments.reduce((sum, item) => sum + item.amount, 0) -
              input.discountAdjustments.reduce((sum, item) => sum + item.amount, 0),
          );
          setOrders((prev) =>
            prev.map((item) =>
              item.id === orderId
                  ? {
                    ...item,
                    orderDate: input.orderDate,
                    orderNo: input.orderNo,
                    customerName: input.customerName,
                    channel: input.channel || undefined,
                    items: snapshotItems,
                    extraAdjustments: input.extraAdjustments,
                    discountAdjustments: input.discountAdjustments,
                    extraAmount: input.extraAdjustments.reduce((sum, adj) => sum + adj.amount, 0),
                    discountAmount: input.discountAdjustments.reduce((sum, adj) => sum + adj.amount, 0),
                    totalAmount,
                    memo: input.memo,
                  }
                : item,
            ),
          );
        }}
      />
    </>
  );
}
