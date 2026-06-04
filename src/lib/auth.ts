/**
 * 인증 유틸리티
 * - 토큰은 쿠키(`sellog_token`)에 저장 → 미들웨어에서 서버사이드 검사 가능
 * - 미들웨어는 토큰 존재 여부만 확인. 실제 유효성 검증은 BE에서 처리.
 */

const TOKEN_COOKIE = "sellog_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7일

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

// ─────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────

export const AUTH_API_BASE =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:8000/api/v1";

export type LoginResult =
  | { ok: true; accessToken: string }
  | { ok: false; message: string };

/** 로그인 — BE POST /auth/login 호출 후 쿠키 저장 */
export async function login(
  email: string,
  password: string,
): Promise<LoginResult> {
  try {
    const res = await fetch(`${AUTH_API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
        message?: string;
      };
      const message =
        body?.error?.message ?? body?.message ?? "이메일 또는 비밀번호를 확인해 주세요.";
      return { ok: false, message };
    }

    const data = (await res.json()) as {
      data?: { accessToken?: string; access_token?: string };
      accessToken?: string;
      access_token?: string;
    };

    const token =
      data?.data?.accessToken ??
      data?.data?.access_token ??
      data?.accessToken ??
      data?.access_token ??
      "";

    if (!token) {
      return { ok: false, message: "서버에서 토큰을 받지 못했습니다." };
    }

    setTokenCookie(token);
    return { ok: true, accessToken: token };
  } catch {
    return { ok: false, message: "서버에 연결할 수 없습니다." };
  }
}

/** 개발용 — BE 없이 로그인 버튼만으로 통과 (미들웨어용 쿠키 설정) */
export function loginDevBypass(): void {
  setTokenCookie("dev-bypass");
}

/** 로그아웃 — 쿠키 삭제 후 /login으로 이동 */
export function logout() {
  clearTokenCookie();
  window.location.replace("/login");
}

/** 현재 토큰 반환 (클라이언트) */
export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${TOKEN_COOKIE}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}
