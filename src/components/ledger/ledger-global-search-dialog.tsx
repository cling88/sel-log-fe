"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MODAL_DIALOG_FOOTER_CLASS } from "@/components/common/modal-footer-classes";
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
import { searchLedgerGlobally } from "@/lib/ledger-global-search";
import { toYearMonthParam } from "@/lib/ledger-period";
import type { LedgerGlobalSearchResult } from "@/types/ledger-global-search";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

interface LedgerGlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function navigateToSearchResult(
  router: ReturnType<typeof useRouter>,
  searchParams: URLSearchParams,
  result: LedgerGlobalSearchResult,
  query: string,
) {
  const params = new URLSearchParams(searchParams.toString());
  params.set("tab", result.tab);
  params.set("q", query.trim());

  if (result.purchaseSub) params.set("purchaseSub", result.purchaseSub);
  else params.delete("purchaseSub");

  if (result.month) {
    const [yearStr, monthStr] = result.month.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (year && month) {
      params.set("month", toYearMonthParam(year, month));
    }
  }

  router.replace(`/ledger?${params.toString()}`);
}

export function LedgerGlobalSearchDialog({
  open,
  onOpenChange,
}: LedgerGlobalSearchDialogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");

  const results = useMemo(() => searchLedgerGlobally(query), [query]);
  const trimmed = query.trim();

  const handleSelect = (result: LedgerGlobalSearchResult) => {
    navigateToSearchResult(router, searchParams, result, trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setQuery("");
      }}
    >
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-lg"
        aria-describedby={undefined}
      >
        <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4">
          <DialogTitle>장부 전체 검색</DialogTitle>
          <DialogDescription>
            매입·매출·수익·상품관리 전체에서 검색합니다. 결과를 선택하면 해당 탭으로
            이동합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b border-[var(--color-border)] px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <Input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="상품명, 주문번호, 항목명, SKU 등"
              className="h-10 pl-9"
            />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto px-2 py-2">
          {!trimmed ? (
            <p className="px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
              검색어를 입력하세요.
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
              검색 결과가 없습니다.
            </p>
          ) : (
            <ul className="space-y-1">
              {results.map((result) => (
                <li key={result.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(result)}
                    className={cn(
                      "w-full rounded-lg px-3 py-2.5 text-left transition-colors",
                      "hover:bg-[var(--primary-50)]/60",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-[var(--primary-50)] px-2 py-0.5 text-[11px] font-medium text-[var(--primary-600)]">
                        {result.tabLabel}
                        {result.subLabel ? ` · ${result.subLabel}` : ""}
                      </span>
                      {result.date ? (
                        <span className="text-[11px] tabular-nums text-[var(--color-text-muted)]">
                          {result.date}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm font-medium text-[var(--color-text-primary)]">
                      {result.title}
                    </p>
                    {result.subtitle ? (
                      <p className="mt-0.5 truncate text-xs text-[var(--color-text-secondary)]">
                        {result.subtitle}
                      </p>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className={MODAL_DIALOG_FOOTER_CLASS}>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LedgerGlobalSearchTrigger({
  className,
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="장부 전체 검색"
        className={className}
        onClick={() => setOpen(true)}
      >
        <Search className="size-5" />
      </button>
      <LedgerGlobalSearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
