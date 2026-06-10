"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { replaceSourcingQuery } from "@/lib/sourcing-url";

/** 소싱 탭 목록 검색 — URL `q`, Enter·검색 버튼으로 반영 후 API 조회 */
export function useSourcingUrlSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const urlSearch = searchParams.get("q") ?? "";

  /** API·목록에 쓰는 확정 검색어 (검색 버튼 클릭 시 즉시 반영) */
  const [committedSearch, setCommittedSearch] = useState(urlSearch);
  const [draft, setDraft] = useState(urlSearch);

  useEffect(() => {
    setCommittedSearch(urlSearch);
    setDraft(urlSearch);
  }, [urlSearch]);

  const pushQueryToUrl = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      replaceSourcingQuery(router, pathname, searchParams, (params) => {
        if (trimmed) params.set("q", trimmed);
        else params.delete("q");
        params.delete("page");
      });
    },
    [pathname, router, searchParams, searchParamsKey],
  );

  const setSearch = useCallback((value: string) => {
    setDraft(value);
  }, []);

  const applySearch = useCallback(
    (value?: string) => {
      const next = (value !== undefined ? value : draft).trim();
      setDraft(value !== undefined ? value : draft);
      setCommittedSearch(next);
      pushQueryToUrl(next);
    },
    [draft, pushQueryToUrl],
  );

  const clearSearch = useCallback(() => {
    setDraft("");
    setCommittedSearch("");
    pushQueryToUrl("");
  }, [pushQueryToUrl]);

  return {
    search: draft,
    committedSearch,
    setSearch,
    applySearch,
    clearSearch,
  };
}
