import { ApiError } from "@/lib/api-client";
import {
  clearSession,
  getApiBaseUrl,
  getToken,
  refreshAccessTokenOnce,
} from "@/lib/auth";
import { toYearMonthParam } from "@/lib/ledger-period";
import type { LedgerTabId } from "@/types/common";

export type LedgerPeriodExportMode = "year" | "month";
export type ProductExportScope = "all" | "active";

export type LedgerExportPath =
  | "/export/purchase"
  | "/export/sales"
  | "/export/income"
  | "/export/products";

const EXPORT_PATH: Record<LedgerTabId, LedgerExportPath> = {
  purchase: "/export/purchase",
  sale: "/export/sales",
  income: "/export/income",
  products: "/export/products",
};

const PERIOD_TAB_LABEL: Record<"purchase" | "sale" | "income", string> = {
  purchase: "매입",
  sale: "매출",
  income: "수익",
};

function parseFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) return null;
  const match = /filename\*=UTF-8''(.+)/i.exec(contentDisposition);
  if (match?.[1]) {
    try {
      return decodeURIComponent(match[1].trim());
    } catch {
      return match[1].trim();
    }
  }
  const quoted = /filename="([^"]+)"/i.exec(contentDisposition);
  if (quoted?.[1]) return quoted[1].trim();
  return null;
}

function defaultPeriodFilename(
  tab: "purchase" | "sale" | "income",
  mode: LedgerPeriodExportMode,
  year: number,
  month: number,
): string {
  const label = PERIOD_TAB_LABEL[tab];
  const ym = toYearMonthParam(year, month);
  return mode === "year" ? `${label}_${year}.xlsx` : `${label}_${ym}.xlsx`;
}

function defaultProductFilename(scope: ProductExportScope): string {
  return scope === "all" ? "상품목록_전체.xlsx" : "상품목록_활성.xlsx";
}

function buildPeriodExportPath(
  tab: "purchase" | "sale" | "income",
  mode: LedgerPeriodExportMode,
  year: number,
  month: number,
): string {
  const params = new URLSearchParams();
  if (mode === "year") {
    params.set("year", String(year));
  } else {
    params.set("month", toYearMonthParam(year, month));
  }
  return `${EXPORT_PATH[tab]}?${params.toString()}`;
}

function buildProductExportPath(scope: ProductExportScope): string {
  const params = new URLSearchParams({ scope });
  return `${EXPORT_PATH.products}?${params.toString()}`;
}

async function parseExportError(
  res: Response,
  tab: LedgerTabId,
): Promise<ApiError> {
  const body = (await res.json().catch(() => ({}))) as {
    error?: { code?: string; message?: string };
    message?: string;
  };
  const code = body.error?.code;
  const message = body.error?.message ?? body.message;

  if (res.status === 404 || code === "NOT_FOUND") {
    return new ApiError(
      404,
      tab === "products"
        ? "다운로드할 상품이 없습니다."
        : "해당 기간 데이터가 없습니다.",
    );
  }
  if (code === "VALIDATION_ERROR") {
    return new ApiError(400, message ?? "요청 조건을 확인해 주세요.");
  }

  return new ApiError(
    res.status,
    message ?? `엑셀 다운로드에 실패했습니다. (${res.status})`,
  );
}

async function fetchExportBlob(
  path: string,
  tab: LedgerTabId,
  retried = false,
): Promise<Response> {
  let token = getToken();
  if (!token) {
    const refreshed = await refreshAccessTokenOnce();
    if (refreshed) token = getToken();
  }
  if (!token) {
    clearSession();
    throw new ApiError(401, "로그인이 필요합니다.");
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const res = await fetch(`${getApiBaseUrl()}${normalizedPath}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "same-origin",
  });

  if (res.status === 401 && !retried) {
    const refreshed = await refreshAccessTokenOnce();
    if (refreshed) return fetchExportBlob(path, tab, true);
    clearSession();
    throw new ApiError(401, "로그인이 필요합니다.");
  }

  if (!res.ok) {
    throw await parseExportError(res, tab);
  }

  return res;
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** GET /export/* — blob 다운로드 (JSON 래핑 없음) */
export async function downloadLedgerPeriodExcelExport(
  tab: "purchase" | "sale" | "income",
  mode: LedgerPeriodExportMode,
  period: { year: number; month: number },
): Promise<void> {
  const path = buildPeriodExportPath(tab, mode, period.year, period.month);
  const res = await fetchExportBlob(path, tab);
  const blob = await res.blob();
  const filename =
    parseFilename(res.headers.get("Content-Disposition")) ??
    defaultPeriodFilename(tab, mode, period.year, period.month);
  triggerBlobDownload(blob, filename);
}

/** GET /export/products?scope=all|active */
export async function downloadProductExcelExport(
  scope: ProductExportScope,
): Promise<void> {
  const path = buildProductExportPath(scope);
  const res = await fetchExportBlob(path, "products");
  const blob = await res.blob();
  const filename =
    parseFilename(res.headers.get("Content-Disposition")) ??
    defaultProductFilename(scope);
  triggerBlobDownload(blob, filename);
}

export function getLedgerExportErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "엑셀 다운로드에 실패했습니다.";
}
