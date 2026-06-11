"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import { useLedgerMonthParam } from "@/hooks/use-ledger-month";
import { useLedgerUrlSearch } from "@/hooks/use-ledger-url-search";
import { PRODUCTS_QUERY_KEY } from "@/hooks/use-products";
import { useUserSettings } from "@/hooks/use-settings";
import { SALES_CHANNELS_QUERY_KEY } from "@/hooks/use-sales-channels";
import {
  getSaleErrorMessage,
  useCreateSaleOrder,
  useDeleteSaleOrder,
  usePatchSaleOrderCancel,
  useSaleOrderList,
  useUpdateSaleOrder,
} from "@/hooks/use-sales";
import { MODAL_DIALOG_FOOTER_CLASS } from "@/components/common/modal-footer-classes";
import { LedgerEmptyState } from "@/components/ledger/empty-state";
import {
  LedgerListShell,
  ledgerListBodyClass,
  ledgerListFooterClass,
} from "@/components/ledger/ledger-list-shell";
import { SaleOrderList } from "@/components/ledger/sale/sale-order-list";
import { SaleMarginEstimateDisplay } from "@/components/ledger/sale/sale-margin-estimate";
import { SaleChannelSelectField } from "@/components/ledger/sale/sale-channel-select-field";
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
import { Trash2 } from "lucide-react";
import { fetchProducts } from "@/lib/api/products";
import { fetchSalesChannels } from "@/lib/api/sales-channels";
import { estimateSaleMargin, checkSaleOrderNo, toSaleOrderPayload } from "@/lib/api/sales";
import { todayIso } from "@/lib/date";
import { formatAmount } from "@/lib/purchase-product-calc";
import type { InventoryProduct } from "@/types/inventory-product";
import type { SaleMarginEstimate, SaleOrder, SaleOrderAdjustment } from "@/types/sale";

const PRODUCTS_PICKER_QUERY_KEY = [...PRODUCTS_QUERY_KEY, "picker", "sale"] as const;

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
  channelId: string | null;
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

function createEmptyInput(defaultChannelId?: string | null): SaleOrderFormInput {
  return {
    orderDate: todayIso(),
    orderNo: "",
    customerName: "",
    channelId: defaultChannelId ?? null,
    items: [createEmptyItem()],
    extraAdjustments: [],
    discountAdjustments: [],
    memo: "",
  };
}

function validateSaleOrderForm(form: SaleOrderFormInput): string | null {
  const orderDate = form.orderDate.trim();
  if (!orderDate) return "주문일을 입력해 주세요.";

  const orderNo = form.orderNo.trim();
  if (!orderNo) return "주문번호를 입력해 주세요.";
  if (orderNo.length > 100) return "주문번호는 100자 이하여야 합니다.";

  const customerName = form.customerName.trim();
  if (!customerName) return "주문자명을 입력해 주세요.";
  if (customerName.length > 100) return "주문자명은 100자 이하여야 합니다.";

  if (form.items.length === 0) return "상품 행을 1개 이상 추가해 주세요.";

  const itemsWithProduct = form.items.filter((item) => item.productId.trim());
  if (itemsWithProduct.length === 0) return "상품을 1개 이상 선택해 주세요.";

  for (const item of itemsWithProduct) {
    const quantity = Math.trunc(Number(item.quantity));
    if (quantity < 1) return "수량은 1개 이상이어야 합니다.";
    const lineAmount = Math.trunc(Number(item.lineAmount));
    if (lineAmount < 0) return "상품금액은 0 이상이어야 합니다.";
  }

  const extraWithoutLabel = form.extraAdjustments.find(
    (item) => (Number(item.amount) || 0) > 0 && !item.label.trim(),
  );
  if (extraWithoutLabel) {
    return "추가금 항목에 금액이 있으면 항목명을 입력해 주세요.";
  }

  const discountWithoutLabel = form.discountAdjustments.find(
    (item) => (Number(item.amount) || 0) > 0 && !item.label.trim(),
  );
  if (discountWithoutLabel) {
    return "할인 항목에 금액이 있으면 항목명을 입력해 주세요.";
  }

  const memo = form.memo?.trim() ?? "";
  if (memo.length > 500) return "비고는 500자 이하여야 합니다.";

  return null;
}

function formInputToPayload(input: SaleOrderFormInput) {
  return toSaleOrderPayload({
    orderDate: input.orderDate,
    orderNo: input.orderNo,
    customerName: input.customerName,
    channelId: input.channelId,
    items: input.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      lineAmount: item.lineAmount,
    })),
    extraAdjustments: input.extraAdjustments,
    discountAdjustments: input.discountAdjustments,
    memo: input.memo,
  });
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
  const { settings } = useUserSettings();
  const isEdit = !!editOrder;
  const readOnly = editOrder?.status === "cancelled";
  const [form, setForm] = useState<SaleOrderFormInput>(() =>
    createEmptyInput(settings.defaultChannelId),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderNoDuplicate, setOrderNoDuplicate] = useState<string | null>(null);
  const [orderNoChecking, setOrderNoChecking] = useState(false);
  const [marginEstimate, setMarginEstimate] = useState<SaleMarginEstimate | null>(
    null,
  );
  const [marginLoading, setMarginLoading] = useState(false);
  const formSessionRef = useRef<string | null>(null);
  const estimateRequestIdRef = useRef(0);
  const orderNoCheckRef = useRef(0);

  useEffect(() => {
    if (!open) {
      formSessionRef.current = null;
      return;
    }

    const sessionKey = editOrder ? `edit:${editOrder.id}` : "new";
    if (formSessionRef.current === sessionKey) return;
    formSessionRef.current = sessionKey;

    if (editOrder) {
      setForm({
        orderDate: editOrder.orderDate,
        orderNo: editOrder.orderNo,
        customerName: editOrder.customerName,
        channelId: editOrder.channelId,
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
      setMarginEstimate(editOrder.marginEstimate);
      setError(null);
      return;
    }
    setForm(createEmptyInput(settings.defaultChannelId));
    setError(null);
    setMarginEstimate(null);
    setOrderNoDuplicate(null);
  }, [open, editOrder, getSuggestedUnitPrice, settings.defaultChannelId]);

  useEffect(() => {
    if (!open || readOnly) {
      setOrderNoDuplicate(null);
      setOrderNoChecking(false);
      return;
    }

    const orderNo = form.orderNo.trim();
    if (!orderNo) {
      setOrderNoDuplicate(null);
      setOrderNoChecking(false);
      return;
    }

    const requestId = orderNoCheckRef.current + 1;
    orderNoCheckRef.current = requestId;
    setOrderNoChecking(true);

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const result = await checkSaleOrderNo(
            orderNo,
            editOrder?.id,
          );
          if (orderNoCheckRef.current !== requestId) return;
          if (result.exists && result.order) {
            setOrderNoDuplicate(
              `이미 등록된 주문번호입니다 (${result.order.orderDate}, ${result.order.status === "cancelled" ? "취소" : "정상"})`,
            );
          } else {
            setOrderNoDuplicate(null);
          }
        } catch {
          if (orderNoCheckRef.current !== requestId) return;
          setOrderNoDuplicate(null);
        } finally {
          if (orderNoCheckRef.current === requestId) {
            setOrderNoChecking(false);
          }
        }
      })();
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, readOnly, form.orderNo, editOrder?.id]);

  useEffect(() => {
    if (!open || readOnly) {
      setMarginEstimate(null);
      setMarginLoading(false);
      return;
    }

    const hasProduct = form.items.some((item) => item.productId.trim());
    if (!hasProduct) {
      setMarginEstimate(null);
      setMarginLoading(false);
      return;
    }

    const requestId = estimateRequestIdRef.current + 1;
    estimateRequestIdRef.current = requestId;
    setMarginLoading(true);

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const payload = formInputToPayload(form);
          const result = await estimateSaleMargin(payload);
          if (estimateRequestIdRef.current !== requestId) return;
          setMarginEstimate(result);
        } catch {
          if (estimateRequestIdRef.current !== requestId) return;
          setMarginEstimate(null);
        } finally {
          if (estimateRequestIdRef.current === requestId) {
            setMarginLoading(false);
          }
        }
      })();
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [open, readOnly, form]);

  const patch = (p: Partial<SaleOrderFormInput>) => {
    if (readOnly) return;
    setForm((prev) => ({ ...prev, ...p }));
    setError(null);
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
    setError(null);
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
    if (readOnly) return;

    const validationError = validateSaleOrderForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (orderNoDuplicate) {
      setError(orderNoDuplicate);
      return;
    }

    const orderNo = form.orderNo.trim();
    const customerName = form.customerName.trim();

    const normalizedItems = form.items
      .map((item) => ({
        productId: item.productId,
        quantity: Math.max(1, Number(item.quantity) || 1),
        lineAmount: Math.max(0, Number(item.lineAmount) || 0),
        unitPrice: Math.max(0, Number(item.unitPrice) || 0),
      }))
      .filter((item) => !!item.productId);

    const nextInput: SaleOrderFormInput = {
      ...form,
      orderDate: form.orderDate.trim(),
      orderNo,
      customerName,
      items: normalizedItems,
      extraAdjustments: form.extraAdjustments
        .map((item) => ({
          ...item,
          label: item.label.trim(),
          amount: Math.max(0, Number(item.amount) || 0),
        }))
        .filter((item) => item.label.length >= 1 && item.amount > 0),
      discountAdjustments: form.discountAdjustments
        .map((item) => ({
          ...item,
          label: item.label.trim(),
          amount: Math.max(0, Number(item.amount) || 0),
        }))
        .filter((item) => item.label.length >= 1 && item.amount > 0),
      memo: form.memo?.trim() || "",
    };

    setSubmitting(true);
    try {
      if (isEdit && editOrder) {
        await onUpdate(editOrder.id, nextInput);
      } else {
        await onSave(nextInput);
      }
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
        aria-describedby={undefined}
      >
        <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4">
          <DialogTitle>{isEdit ? "매출 상세" : "매출 등록"}</DialogTitle>
          <DialogDescription>
            {readOnly
              ? "취소된 주문은 조회만 가능합니다."
              : "주문 확정 건을 수동으로 기록합니다."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {readOnly ? (
            <p className="mb-4 rounded-lg border border-[var(--color-warning)]/40 bg-amber-50 px-3 py-2 text-sm text-[var(--color-text-secondary)]">
              취소된 주문은 수정할 수 없습니다.
            </p>
          ) : null}
          {error ? (
            <p className="mb-4 rounded-lg border border-[var(--color-danger)]/30 bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sale-date">
                주문일 <span className="text-[var(--color-danger)]">*</span>
              </Label>
              <Input
                id="sale-date"
                type="date"
                value={form.orderDate}
                onChange={(e) => patch({ orderDate: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sale-order-no">
                주문번호 <span className="text-[var(--color-danger)]">*</span>
              </Label>
              <Input
                id="sale-order-no"
                value={form.orderNo}
                onChange={(e) => patch({ orderNo: e.target.value })}
                placeholder="예: SO-20260602-001"
              />
              {orderNoChecking ? (
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  주문번호 확인 중…
                </p>
              ) : orderNoDuplicate ? (
                <p className="text-[11px] text-[var(--color-danger)]">
                  {orderNoDuplicate}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sale-customer">
                주문자명 <span className="text-[var(--color-danger)]">*</span>
              </Label>
              <Input
                id="sale-customer"
                value={form.customerName}
                onChange={(e) => patch({ customerName: e.target.value })}
                placeholder="예: 홍길동"
              />
            </div>
            <SaleChannelSelectField
              channelId={form.channelId}
              channelSnapshot={editOrder?.channel}
              disabled={readOnly}
              onChannelIdChange={(id) => patch({ channelId: id })}
            />
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between">
                <Label>
                  주문항목 <span className="text-[var(--color-danger)]">*</span>
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  + 상품 행 추가
                </Button>
              </div>
              <div className="space-y-2 rounded-lg border border-[var(--color-border)] p-3">
                <div className="hidden gap-2 text-xs text-[var(--color-text-muted)] sm:grid sm:grid-cols-12">
                  <span className="sm:col-span-6">
                    상품 <span className="text-[var(--color-danger)]">*</span>
                  </span>
                  <span className="sm:col-span-2">
                    수량 <span className="text-[var(--color-danger)]">*</span>
                  </span>
                  <span className="sm:col-span-3">
                    상품금액 <span className="text-[var(--color-danger)]">*</span>
                  </span>
                </div>
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
              <div className="space-y-2">
                {form.extraAdjustments.length === 0 ? (
                  <p className="px-1 py-1 text-xs text-[var(--color-text-muted)]">없음</p>
                ) : (
                  form.extraAdjustments.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Input
                        value={item.label}
                        onChange={(e) =>
                          updateAdjustment("extraAdjustments", item.id, { label: e.target.value })
                        }
                        placeholder="항목명"
                        className="h-8 min-w-0 flex-1"
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
                        placeholder="금액"
                        className="h-8 w-24 shrink-0 tabular-nums sm:w-28"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="size-8 shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                        onClick={() => removeAdjustment("extraAdjustments", item.id)}
                        aria-label="추가금 항목 삭제"
                      >
                        <Trash2 className="size-4" />
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
              <div className="space-y-2">
                {form.discountAdjustments.length === 0 ? (
                  <p className="px-1 py-1 text-xs text-[var(--color-text-muted)]">없음</p>
                ) : (
                  form.discountAdjustments.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Input
                        value={item.label}
                        onChange={(e) =>
                          updateAdjustment("discountAdjustments", item.id, {
                            label: e.target.value,
                          })
                        }
                        placeholder="항목명"
                        className="h-8 min-w-0 flex-1"
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
                        placeholder="금액"
                        className="h-8 w-24 shrink-0 tabular-nums sm:w-28"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="size-8 shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                        onClick={() => removeAdjustment("discountAdjustments", item.id)}
                        aria-label="할인금 항목 삭제"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>총 주문금액 (자동계산)</Label>
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/50 px-3 py-2.5">
                <div className="space-y-1 text-xs tabular-nums text-[var(--color-text-secondary)]">
                  <p>
                    품목합계{" "}
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {formatAmount(itemsAmount)}원
                    </span>
                  </p>
                  {form.extraAdjustments.map((item) =>
                    (Number(item.amount) || 0) > 0 ? (
                      <p key={item.id}>
                        + {item.label.trim() || "추가금"}{" "}
                        <span className="font-medium text-[var(--color-text-primary)]">
                          {formatAmount(Number(item.amount) || 0)}원
                        </span>
                      </p>
                    ) : null,
                  )}
                  {form.discountAdjustments.map((item) =>
                    (Number(item.amount) || 0) > 0 ? (
                      <p key={item.id}>
                        − {item.label.trim() || "할인"}{" "}
                        <span className="font-medium text-[var(--color-text-primary)]">
                          {formatAmount(Number(item.amount) || 0)}원
                        </span>
                      </p>
                    ) : null,
                  )}
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    = 총 {formatAmount(totalAmount)}원
                  </p>
                </div>
                <SaleMarginEstimateDisplay
                  margin={marginEstimate}
                  loading={marginLoading}
                  className="mt-2"
                />
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
            {readOnly ? "닫기" : "취소"}
          </Button>
          {!readOnly ? (
            <Button type="button" disabled={submitting} onClick={() => void submit()}>
              {submitting ? "저장 중…" : isEdit ? "저장" : "등록"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SaleTabPanel() {
  const { alert, confirm } = useAppDialog();
  const month = useLedgerMonthParam();
  const { search, committedSearch, setSearch, applySearch } = useLedgerUrlSearch({
    commit: "manual",
  });
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOrderId, setEditOrderId] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [month, committedSearch]);

  const {
    data: listData,
    isLoading,
    isError,
    error,
    refetch,
  } = useSaleOrderList(committedSearch, page);

  const { data: productsData } = useQuery({
    queryKey: PRODUCTS_PICKER_QUERY_KEY,
    queryFn: () =>
      fetchProducts({
        active: true,
        productKind: "product",
        limit: 100,
        page: 1,
      }),
    staleTime: 60_000,
  });

  useQuery({
    queryKey: SALES_CHANNELS_QUERY_KEY,
    queryFn: fetchSalesChannels,
    staleTime: 60_000,
  });

  const createOrder = useCreateSaleOrder();
  const updateOrder = useUpdateSaleOrder();
  const patchCancel = usePatchSaleOrderCancel();
  const deleteOrder = useDeleteSaleOrder();

  const orders = listData?.orders ?? [];
  const listMeta = listData?.meta;
  const listTotal = listMeta?.total ?? 0;
  const listPage = listMeta?.page ?? page;
  const listLimit = listMeta?.limit ?? 8;
  const totalPages = Math.max(1, Math.ceil(listTotal / listLimit));
  const todayTotal = listMeta?.todayTotal ?? 0;
  const monthTotal = listMeta?.monthTotal ?? 0;

  const editOrder = orders.find((o) => o.id === editOrderId) ?? null;

  const visibleProducts = useMemo(
    () => (productsData?.items ?? []).filter((p) => !p.deletedAtIso),
    [productsData?.items],
  );

  const suggestedUnitPriceByProductId = useMemo(() => {
    const map = new Map<string, number>();
    visibleProducts.forEach((product) => {
      map.set(product.id, Math.max(0, Number(product.currentPrice) || 0));
    });
    return map;
  }, [visibleProducts]);

  const canRegisterSale = visibleProducts.length > 0;
  const hasCommittedSearch = committedSearch.trim().length > 0;
  const showCatalogEmpty =
    !hasCommittedSearch && !isLoading && !isError && listTotal === 0;
  const listErrorMessage = isError ? getSaleErrorMessage(error) : null;

  const openRegister = () => {
    setEditOrderId(null);
    setDialogOpen(true);
  };

  const openEdit = (orderId: string) => {
    setEditOrderId(orderId);
    setDialogOpen(true);
  };

  const handleOpenRegister = async () => {
    if (!canRegisterSale) {
      await alert("상품관리에서 상품을 먼저 등록해 주세요.");
      return;
    }
    openRegister();
  };

  const handleSave = async (input: SaleOrderFormInput) => {
    await createOrder.mutateAsync(formInputToPayload(input));
    setDialogOpen(false);
    await alert("매출이 등록되었습니다.");
  };

  const handleUpdate = async (orderId: string, input: SaleOrderFormInput) => {
    const target = orders.find((o) => o.id === orderId);
    if (target?.status === "cancelled") {
      await alert("취소된 주문은 수정할 수 없습니다.");
      return;
    }
    await updateOrder.mutateAsync({
      id: orderId,
      body: formInputToPayload(input),
    });
    setEditOrderId(null);
    setDialogOpen(false);
    await alert("매출이 저장되었습니다.");
  };

  const toggleCancel = async (order: SaleOrder) => {
    const cancel = order.status === "normal";
    const ok = await confirm({
      title: cancel ? "주문 취소 처리" : "주문 취소 해제",
      message: cancel
        ? "이 주문을 취소 상태로 변경할까요? 재고가 복구됩니다."
        : "이 주문을 정상 상태로 변경할까요? 재고가 다시 차감됩니다.",
      confirmLabel: "적용",
      destructive: cancel,
    });
    if (!ok) return;

    await patchCancel.mutateAsync({ id: order.id, cancel });
    await alert(cancel ? "취소 처리되었습니다." : "정상 처리되었습니다.");
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

    await deleteOrder.mutateAsync(order.id);
    await alert("삭제되었습니다.");
  };

  return (
    <>
      <div className="mb-4 grid grid-cols-1 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] sm:grid-cols-2">
        <div className="border-b border-[var(--color-border)] p-4 sm:border-b-0 sm:border-r">
          <p className="text-xs text-[var(--color-text-secondary)]">오늘 매출</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatAmount(todayTotal)}원
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs text-[var(--color-text-secondary)]">이번달 매출</p>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {formatAmount(monthTotal)}원
          </p>
        </div>
      </div>

      {showCatalogEmpty ? (
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
            onSearchChange={setSearch}
            searchSubmitMode
            onSearchSubmit={() => {
              applySearch();
              setPage(1);
            }}
            onSearchClear={() => {
              applySearch("");
              setPage(1);
            }}
            searchPlaceholder="주문번호, 주문자명, 상품명 검색"
            registerLabel="+ 매출 등록"
            onRegister={() => void handleOpenRegister()}
          />
          {isLoading && orders.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">
              매출 목록을 불러오는 중입니다.
            </p>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <p className="text-sm text-[var(--color-danger)]">{listErrorMessage}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
                다시 시도
              </Button>
            </div>
          ) : orders.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">
              {hasCommittedSearch
                ? "검색 결과가 없습니다."
                : "이번 달 매출 내역이 없습니다."}
            </p>
          ) : (
            <>
              <div className={ledgerListBodyClass}>
                <SaleOrderList
                  orders={orders}
                  onEdit={openEdit}
                  onToggleCancel={toggleCancel}
                  onRemove={removeOrder}
                />
              </div>
              <div className={ledgerListFooterClass}>
                <PurchaseListPagination
                  page={listPage}
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
        onSave={handleSave}
        onUpdate={handleUpdate}
      />
    </>
  );
}
