/**
 * 인증 유틸리티
 * - accessToken: 쿠키 `sellog_token` (미들웨어) + localStorage (API Authorization, JWT 안전)
 * - refreshToken / user: localStorage
 */

const TOKEN_COOKIE = "sellog_token";
const ACCESS_STORAGE_KEY = "sellog_access_token";
const REFRESH_STORAGE_KEY = "sellog_refresh_token";
const USER_STORAGE_KEY = "sellog_user";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7일

export interface AuthUser {
  id: string;
  email: string;
}

export interface LoginSuccessData {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

import { resolveBackendApiBaseUrl } from "@/lib/backend-origin";

/**
 * API 베이스 (`/api/v1` 포함)
 * - 브라우저: 같은 origin `/api/v1` → Next rewrites가 BE로 프록시
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "/api/v1";
  }

  return resolveBackendApiBaseUrl();
}

function readCookieToken(): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${TOKEN_COOKIE}=`;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(prefix));
  if (!match) return null;
  const value = match.slice(prefix.length);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function setTokenCookie(token: string) {
  document.cookie = [
    `${TOKEN_COOKIE}=${encodeURIComponent(token)}`,
    `path=/`,
    `max-age=${COOKIE_MAX_AGE}`,
    `SameSite=Lax`,
  ].join("; ");
}

function clearTokenCookie() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
}

function persistSession(data: LoginSuccessData) {
  setTokenCookie(data.accessToken);
  if (typeof globalThis.localStorage !== "undefined") {
    globalThis.localStorage.setItem(ACCESS_STORAGE_KEY, data.accessToken);
    globalThis.localStorage.setItem(REFRESH_STORAGE_KEY, data.refreshToken);
    globalThis.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
  }
}

function getJwtExpSec(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(normalized)) as { exp?: number };
    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

/** accessToken 만료 임박(기본 2분 전) */
export function isAccessTokenExpiringSoon(
  token: string,
  skewSec = 120,
): boolean {
  const exp = getJwtExpSec(token);
  if (!exp) return false;
  return exp * 1000 <= Date.now() + skewSec * 1000;
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * POST /api/v1/auth/refresh
 * - 요청: `{ refreshToken }`
 * - 응답: `{ data: { accessToken, refreshToken, user } }` (refresh 로테이션)
 */
export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()?.trim();
  if (!refreshToken) return false;

  const storedUser = getStoredUser();

  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const body = (await res.json().catch(() => ({}))) as {
      data?: LoginSuccessData;
      error?: { message?: string };
    };

    const payload = body?.data;
    if (!res.ok || !payload) return false;

    const nextAccess = payload.accessToken?.trim();
    const nextRefresh = payload.refreshToken?.trim();
    if (!nextAccess || !nextRefresh) return false;

    const user = payload.user ?? storedUser;
    if (!user?.id) return false;

    persistSession({
      accessToken: nextAccess,
      refreshToken: nextRefresh,
      user,
    });
    return true;
  } catch {
    return false;
  }
}

/** 동시 401 시 refresh 요청 1회만 */
export function refreshAccessTokenOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/** 로그인 세션 제거 */
export function clearSession() {
  clearTokenCookie();
  if (typeof globalThis.localStorage !== "undefined") {
    globalThis.localStorage.removeItem(ACCESS_STORAGE_KEY);
    globalThis.localStorage.removeItem(REFRESH_STORAGE_KEY);
    globalThis.localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export type LoginResult =
  | { ok: true; data: LoginSuccessData }
  | { ok: false; message: string };

/** POST /api/v1/auth/login */
export async function login(
  email: string,
  password: string,
): Promise<LoginResult> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const body = (await res.json().catch(() => ({}))) as {
      data?: LoginSuccessData;
      error?: { message?: string };
      message?: string;
    };

    if (!res.ok) {
      const message =
        body?.error?.message ??
        body?.message ??
        "이메일 또는 비밀번호를 확인해 주세요.";
      return { ok: false, message };
    }

    const payload = body?.data;
    if (!payload?.accessToken) {
      return { ok: false, message: "서버에서 토큰을 받지 못했습니다." };
    }

    persistSession(payload);
    return { ok: true, data: payload };
  } catch {
    return { ok: false, message: "서버에 연결할 수 없습니다." };
  }
}

/** 로그아웃 */
export function logout() {
  clearSession();
  if (typeof window !== "undefined") {
    window.location.replace("/login");
  }
}

/**
 * accessToken — API Authorization 헤더용
 * JWT에 `=`가 포함되므로 쿠키는 slice로 파싱, API는 localStorage 우선
 */
export function getToken(): string | null {
  if (typeof globalThis.localStorage !== "undefined") {
    const stored = globalThis.localStorage.getItem(ACCESS_STORAGE_KEY);
    if (stored?.trim()) return stored.trim();
  }
  const fromCookie = readCookieToken();
  if (fromCookie?.trim() && fromCookie !== "dev-bypass") {
    return fromCookie.trim();
  }
  return null;
}

export function getRefreshToken(): string | null {
  if (typeof globalThis.localStorage === "undefined") return null;
  return globalThis.localStorage.getItem(REFRESH_STORAGE_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof globalThis.localStorage === "undefined") return null;
  try {
    const raw = globalThis.localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

/** 로그인 후 세션 동기화 (이미 로그인된 경우 쿠키만 있고 storage 없을 때) */
export function syncTokenFromCookieToStorage(): void {
  const cookie = readCookieToken();
  if (!cookie || cookie === "dev-bypass") return;
  if (typeof globalThis.localStorage === "undefined") return;
  if (!globalThis.localStorage.getItem(ACCESS_STORAGE_KEY)) {
    globalThis.localStorage.setItem(ACCESS_STORAGE_KEY, cookie);
  }
}

/** 앱 로드 시 access 없거나 만료 임박이면 refresh 시도 */
export async function ensureValidAccessToken(): Promise<boolean> {
  const access = getToken();
  if (access && !isAccessTokenExpiringSoon(access)) return true;
  if (!getRefreshToken()) return !!access;
  return refreshAccessTokenOnce();
}
