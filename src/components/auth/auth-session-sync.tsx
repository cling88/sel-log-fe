"use client";

import { useEffect } from "react";
import { ensureValidAccessToken, syncTokenFromCookieToStorage } from "@/lib/auth";

/** 마운트 시 토큰 동기화 + 만료 임박 시 refresh */
export function AuthSessionSync() {
  useEffect(() => {
    syncTokenFromCookieToStorage();
    void ensureValidAccessToken();
  }, []);
  return null;
}
