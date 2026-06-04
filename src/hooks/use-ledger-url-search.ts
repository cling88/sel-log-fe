"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type UseLedgerUrlSearchOptions = {
  /**
   * instant — 입력마다 URL `q` 반영 (클라이언트 필터 탭)
   * manual — Enter·검색 버튼(applySearch) 시에만 URL 반영 (API 검색)
   */
  commit?: "instant" | "manual";
};

/** 장부 탭 목록 검색어 — URL `q` 파라미터와 동기화 */
export function useLedgerUrlSearch(options?: UseLedgerUrlSearchOptions) {
  const commit = options?.commit ?? "instant";
  const router = useRouter();
  const searchParams = useSearchParams();
  const committedSearch = searchParams.get("q") ?? "";
  const [draft, setDraft] = useState(committedSearch);

  useEffect(() => {
    setDraft(committedSearch);
  }, [committedSearch]);

  const pushQueryToUrl = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = value.trim();
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
      router.replace(`/ledger?${params.toString()}`);
    },
    [router, searchParams],
  );

  const setSearch = useCallback(
    (value: string) => {
      setDraft(value);
      if (commit === "instant") {
        pushQueryToUrl(value);
      }
    },
    [commit, pushQueryToUrl],
  );

  const applySearch = useCallback(
    (value?: string) => {
      const next = value !== undefined ? value : draft;
      setDraft(next);
      pushQueryToUrl(next);
    },
    [draft, pushQueryToUrl],
  );

  return {
    /** 입력창·클라이언트 필터용 */
    search: draft,
    /** URL에 반영된 검색어 (API 호출용) */
    committedSearch,
    setSearch,
    applySearch,
  };
}
