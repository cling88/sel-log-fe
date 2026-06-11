"use client";

import { useCallback, useRef, useState } from "react";

/** 중복 클릭 방지 — async 작업 중 버튼 disabled */
export function useAsyncAction() {
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);

  const run = useCallback(async (fn: () => void | Promise<void>) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    try {
      await fn();
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }, []);

  return { pending, run };
}
