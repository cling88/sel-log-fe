import { isHttpUrl } from "@/lib/vendor-label";

/** BE normalize와 동일하게 맞출 키 (퍼블·연동 공용) */
export function normalizeSourcingChannelUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (!isHttpUrl(trimmed)) return trimmed.toLowerCase();
  try {
    const url = new URL(trimmed);
    url.hostname = url.hostname.replace(/^www\./i, "").toLowerCase();
    let path = url.pathname.replace(/\/+$/, "") || "";
    return `${url.protocol}//${url.hostname}${path}${url.search}`.toLowerCase();
  } catch {
    return trimmed.toLowerCase();
  }
}

export function normalizeSourcingChannelName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

export function sourcingChannelDuplicateKey(name: string, url: string): string {
  return `${normalizeSourcingChannelName(name).toLowerCase()}|${normalizeSourcingChannelUrl(url)}`;
}
