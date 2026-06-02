"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { PurchaseSubTabId } from "@/types/common";

export const purchaseSubTabConfig: Record<
  PurchaseSubTabId,
  { label: string; description: string; emptyActionLabel: string }
> = {
  product: {
    label: "상품매입",
    description:
      "판매할 상품을 날짜별로 한 건씩 등록하면, 같은 결제날짜끼리 자동으로 묶여 보입니다. 재고반영 후 개당·최종 원가와 추천 판매가를 계산합니다.",
    emptyActionLabel: "+ 상품 매입 등록하기",
  },
  supply: {
    label: "부가",
    description:
      "포장재·완충재·소모품 등 상품 매입과 별도로 구매한 부가 비용입니다. 항목마다 재고에 반영할지 선택할 수 있으며, 반영하지 않으면 당월 비용으로만 집계됩니다.",
    emptyActionLabel: "+ 부가 항목 등록하기",
  },
  other: {
    label: "기타지출",
    description:
      "월세, 촬영·연구비, 세무·통신 등 재고·원가와 무관한 운영 비용입니다. 날짜, 항목명, 금액, 비고만 간단히 기록하며, 상단 순수익(통장 기준) 집계에 포함됩니다.",
    emptyActionLabel: "+ 기타지출 등록하기",
  },
};

const subTabOrder: PurchaseSubTabId[] = ["product", "supply", "other"];

export function isPurchaseSubTab(value: string | null): value is PurchaseSubTabId {
  return value === "product" || value === "supply" || value === "other";
}

export function PurchaseSubTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const subParam = searchParams.get("purchaseSub");
  const activeSub: PurchaseSubTabId = isPurchaseSubTab(subParam)
    ? subParam
    : "product";

  const setSub = (sub: PurchaseSubTabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "purchase");
    params.set("purchaseSub", sub);
    router.replace(`/ledger?${params.toString()}`);
  };

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2 border-b border-[var(--color-border)] px-4 pt-3 sm:px-5">
        {subTabOrder.map((id) => {
          const { label } = purchaseSubTabConfig[id];
          const active = id === activeSub;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSub(id)}
              className={cn(
                "relative pb-2.5 text-sm font-medium transition-colors",
                active
                  ? "text-[var(--primary-500)]"
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]",
              )}
            >
              {label}
              {active ? (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[var(--primary-500)]" />
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="px-4 py-3 text-sm leading-relaxed text-[var(--color-text-secondary)] sm:px-5">
        {purchaseSubTabConfig[activeSub].description}
      </p>
    </div>
  );
}

export function usePurchaseSubTab(): PurchaseSubTabId {
  const searchParams = useSearchParams();
  const subParam = searchParams.get("purchaseSub");
  return isPurchaseSubTab(subParam) ? subParam : "product";
}
