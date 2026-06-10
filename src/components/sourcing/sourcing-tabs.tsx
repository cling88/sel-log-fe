"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  applySourcingTabParams,
  replaceSourcingQuery,
} from "@/lib/sourcing-url";
import { cn } from "@/lib/utils";
import type { SourcingTabId } from "@/types/sourcing";

const tabOrder: { id: SourcingTabId; label: string; description: string }[] = [
  {
    id: "channels",
    label: "채널소싱",
    description:
      "도매몰·1688·공장 등 소싱처를 등록합니다. 제품소싱에서 채널로 연결할 수 있습니다.",
  },
  {
    id: "products",
    label: "제품소싱",
    description:
      "후보 상품을 이미지·가격·링크와 함께 모아 둡니다. 장부 매입과는 별도로 관리됩니다.",
  },
];

export function SourcingTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: SourcingTabId =
    tabParam === "products" ? "products" : "channels";

  const setTab = (tab: SourcingTabId) => {
    replaceSourcingQuery(router, pathname, searchParams, (params) => {
      applySourcingTabParams(params, tab);
    });
  };

  const activeMeta = tabOrder.find((t) => t.id === activeTab) ?? tabOrder[0];

  return (
    <div className="border-b border-[var(--color-border)]">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2 px-0 pt-1">
        {tabOrder.map(({ id, label }) => {
          const active = id === activeTab;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
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
      <p className="pb-3 pt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        {activeMeta.description}
      </p>
    </div>
  );
}

export function useSourcingTab(): SourcingTabId {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  return tabParam === "products" ? "products" : "channels";
}
