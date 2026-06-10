import { ApiError } from "@/lib/api-client";
import {
  clearSession,
  getApiBaseUrl,
  getToken,
  refreshAccessTokenOnce,
} from "@/lib/auth";

export type SourcingExportKind = "channels" | "products";

const EXPORT_PATH: Record<SourcingExportKind, string> = {
  channels: "/export/sourcing/channels",
  products: "/export/sourcing/products",
};

const DEFAULT_FILENAME: Record<SourcingExportKind, string> = {
  channels: "소싱채널_전체.xlsx",
  products: "제품소싱_전체.xlsx",
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

async function parseExportError(
  res: Response,
  kind: SourcingExportKind,
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
      kind === "channels"
        ? "등록된 소싱 채널이 없습니다."
        : "등록된 제품소싱이 없습니다.",
    );
  }

  return new ApiError(
    res.status,
    message ?? `엑셀 다운로드에 실패했습니다. (${res.status})`,
  );
}

async function fetchExportBlob(
  path: string,
  kind: SourcingExportKind,
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
    if (refreshed) return fetchExportBlob(path, kind, true);
    clearSession();
    throw new ApiError(401, "로그인이 필요합니다.");
  }

  if (!res.ok) {
    throw await parseExportError(res, kind);
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

async function downloadSourcingExcelExport(kind: SourcingExportKind): Promise<void> {
  const path = EXPORT_PATH[kind];
  const res = await fetchExportBlob(path, kind);
  const blob = await res.blob();
  const filename =
    parseFilename(res.headers.get("Content-Disposition")) ??
    DEFAULT_FILENAME[kind];
  triggerBlobDownload(blob, filename);
}

/** GET /export/sourcing/channels */
export async function downloadSourcingChannelsExcelExport(): Promise<void> {
  await downloadSourcingExcelExport("channels");
}

/** GET /export/sourcing/products */
export async function downloadSourcingProductsExcelExport(): Promise<void> {
  await downloadSourcingExcelExport("products");
}

export function getSourcingExportErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "엑셀 다운로드에 실패했습니다.";
}
