"use client";

import { useEffect, useState } from "react";
import { getStoredUser, type AuthUser } from "@/lib/auth";

/** 로그인 시 localStorage(`sellog_user`)에 저장된 계정 정보 */
export function useAuthUser(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  return user;
}
