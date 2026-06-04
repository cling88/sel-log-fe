"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** 장부 탭 목록 검색어 — URL `q` 파라미터와 동기화 */
export function useLedgerUrlSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [search, setSearchState] = useState(urlQuery);

  useEffect(() => {
    setSearchState(urlQuery);
  }, [urlQuery]);

  const setSearch = useCallback(
    (value: string) => {
      setSearchState(value);
      const params = new URLSearchParams(searchParams.toString());
      const trimmed = value.trim();
      if (trimmed) params.set("q", trimmed);
      else params.delete("q");
      router.replace(`/ledger?${params.toString()}`);
    },
    [router, searchParams],
  );

  return { search, setSearch };
}
