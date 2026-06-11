"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { replaceLedgerQuery } from "@/lib/ledger-url";
import {
  fetchLedgerSearch,
  getLedgerSearchErrorMessage,
  LEDGER_SEARCH_QUERY_KEY,
} from "@/lib/api/ledger-search";
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
  pathname: string,
  searchParams: URLSearchParams,
  result: LedgerGlobalSearchResult,
  query: string,
) {
  replaceLedgerQuery(router, pathname, searchParams, (params) => {
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
  });
}

export function LedgerGlobalSearchDialog({
  open,
  onOpenChange,
}: LedgerGlobalSearchDialogProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [committedQ, setCommittedQ] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const resultItemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { data, isFetching, isError, error } = useQuery({
    queryKey: [...LEDGER_SEARCH_QUERY_KEY, committedQ],
    queryFn: () => fetchLedgerSearch(committedQ),
    enabled: open && committedQ.length > 0,
    staleTime: 30_000,
  });

  const results = data?.items ?? [];
  const errorMessage = isError ? getLedgerSearchErrorMessage(error) : null;
  const canNavigateResults = committedQ.length > 0 && !errorMessage && !isFetching;

  const resetSearchState = useCallback(() => {
    setQuery("");
    setCommittedQ("");
    setHighlightIndex(-1);
  }, []);

  const closeDialog = useCallback(() => {
    resetSearchState();
    onOpenChange(false);
  }, [onOpenChange, resetSearchState]);

  useEffect(() => {
    if (!open) {
      resetSearchState();
    }
  }, [open, resetSearchState]);

  useEffect(() => {
    setHighlightIndex(-1);
  }, [committedQ]);

  useEffect(() => {
    if (highlightIndex < 0) return;
    resultItemRefs.current[highlightIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [highlightIndex]);

  const submitSearch = () => {
    const trimmed = query.trim();
    setCommittedQ(trimmed);
    setHighlightIndex(-1);
  };

  const handleSelect = (result: LedgerGlobalSearchResult) => {
    navigateToSearchResult(router, pathname, searchParams, result, committedQ);
    closeDialog();
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      if (!canNavigateResults || results.length === 0) return;
      event.preventDefault();
      setHighlightIndex((prev) => {
        if (event.key === "ArrowDown") {
          return prev < 0 ? 0 : Math.min(prev + 1, results.length - 1);
        }
        return prev < 0 ? results.length - 1 : Math.max(prev - 1, 0);
      });
      return;
    }

    if (event.key === "Enter") {
      if (highlightIndex >= 0 && results[highlightIndex]) {
        event.preventDefault();
        handleSelect(results[highlightIndex]);
        return;
      }
      event.preventDefault();
      submitSearch();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          resetSearchState();
        }
        onOpenChange(next);
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
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlightIndex(-1);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="상품명, 주문번호, 항목명, SKU 등 (Enter로 검색)"
              className="h-10 pl-9"
            />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto px-2 py-2">
          {!committedQ ? (
            <p className="px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
              검색어를 입력한 뒤 Enter를 눌러 검색하세요.
            </p>
          ) : errorMessage ? (
            <p className="px-3 py-8 text-center text-sm text-red-600">
              {errorMessage}
            </p>
          ) : isFetching ? (
            <p className="px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
              검색 중...
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
              검색 결과가 없습니다.
            </p>
          ) : (
            <ul className="space-y-1">
              {results.map((result, index) => (
                <li key={result.id}>
                  <button
                    ref={(el) => {
                      resultItemRefs.current[index] = el;
                    }}
                    type="button"
                    onClick={() => handleSelect(result)}
                    className={cn(
                      "w-full rounded-lg px-3 py-2.5 text-left transition-colors",
                      "hover:bg-[var(--primary-50)]/60",
                      highlightIndex === index && "bg-[var(--primary-100)]",
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
          <Button type="button" variant="outline" onClick={closeDialog}>
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
