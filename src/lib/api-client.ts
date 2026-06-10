import {
  clearSession,
  getApiBaseUrl,
  getToken,
  refreshAccessTokenOnce,
} from "@/lib/auth";

export class ApiError extends Error {
  status: number;
  code?: string;
  data?: unknown;

  constructor(status: number, message: string, code?: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    if (code) this.code = code;
    if (data !== undefined) this.data = data;
  }
}

export type ApiEnvelope<T> = {
  data: T;
  error?: { code?: string; message?: string };
  message?: string;
};

function resolveErrorMessage(body: ApiEnvelope<unknown>, status: number): string {
  return (
    body?.error?.message ??
    body?.message ??
    `요청에 실패했습니다. (${status})`
  );
}

function handleUnauthorized(): void {
  clearSession();
  if (typeof window !== "undefined") {
    const loginUrl = new URL("/login", window.location.origin);
    loginUrl.searchParams.set("from", window.location.pathname);
    window.location.replace(loginUrl.toString());
  }
}

function isAuthPath(path: string): boolean {
  return path.startsWith("/auth/login") || path.startsWith("/auth/refresh");
}

function isUnauthorized(
  status: number,
  body: ApiEnvelope<unknown>,
): boolean {
  return status === 401 || body?.error?.code === "UNAUTHORIZED";
}

async function resolveAccessToken(): Promise<string | null> {
  let token = getToken();
  if (token) return token;
  const refreshed = await refreshAccessTokenOnce();
  if (!refreshed) return null;
  return getToken();
}

/**
 * 인증 필수 API fetch
 * - `Authorization: Bearer <accessToken>`
 * - 401 시 refreshToken으로 access 재발급 후 1회 재시도
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  retried = false,
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  let token = await resolveAccessToken();
  if (!token) {
    handleUnauthorized();
    throw new ApiError(401, "로그인이 필요합니다.");
  }

  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${getApiBaseUrl()}${normalizedPath}`, {
    ...init,
    headers,
    credentials: "same-origin",
  });

  const body = (await res.json().catch(() => ({}))) as ApiEnvelope<unknown>;

  if (
    isUnauthorized(res.status, body) &&
    !retried &&
    !isAuthPath(normalizedPath)
  ) {
    const refreshed = await refreshAccessTokenOnce();
    if (refreshed) {
      return apiFetch<T>(path, init, true);
    }
    handleUnauthorized();
    throw new ApiError(401, body?.error?.message ?? "Unauthorized");
  }

  if (isUnauthorized(res.status, body)) {
    handleUnauthorized();
    throw new ApiError(401, body?.error?.message ?? "Unauthorized");
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      resolveErrorMessage(body, res.status),
      body?.error?.code,
      body?.data,
    );
  }

  return body as T;
}

/**
 * multipart/form-data 업로드 (Content-Type은 브라우저가 boundary 포함해 설정)
 */
export async function apiFetchFormData<T>(
  path: string,
  formData: FormData,
  init?: Omit<RequestInit, "body" | "headers">,
  retried = false,
): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  let token = await resolveAccessToken();
  if (!token) {
    handleUnauthorized();
    throw new ApiError(401, "로그인이 필요합니다.");
  }

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${getApiBaseUrl()}${normalizedPath}`, {
    method: "POST",
    credentials: "same-origin",
    ...init,
    body: formData,
    headers,
  });

  const body = (await res.json().catch(() => ({}))) as ApiEnvelope<unknown>;

  if (
    isUnauthorized(res.status, body) &&
    !retried &&
    !isAuthPath(normalizedPath)
  ) {
    const refreshed = await refreshAccessTokenOnce();
    if (refreshed) {
      return apiFetchFormData<T>(path, formData, init, true);
    }
    handleUnauthorized();
    throw new ApiError(401, body?.error?.message ?? "Unauthorized");
  }

  if (isUnauthorized(res.status, body)) {
    handleUnauthorized();
    throw new ApiError(401, body?.error?.message ?? "Unauthorized");
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      resolveErrorMessage(body, res.status),
      body?.error?.code,
      body?.data,
    );
  }

  return body as T;
}
