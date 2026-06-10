export type PurchaseGroupListKind = "product" | "supply" | "other";

const STORAGE_KEY = "sellog:purchase-group-expanded";

type StoredMap = Partial<
  Record<PurchaseGroupListKind, Partial<Record<string, string[]>>>
>;

function readAll(): StoredMap {
  if (typeof globalThis.localStorage === "undefined") return {};
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as StoredMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(map: StoredMap): void {
  if (typeof globalThis.localStorage === "undefined") return;
  globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function pickMostRecentPaymentDate(dates: string[]): string | null {
  if (dates.length === 0) return null;
  return [...dates].sort((a, b) => b.localeCompare(a))[0];
}

export function readPurchaseGroupExpanded(
  kind: PurchaseGroupListKind,
  scopeKey: string,
): string[] | null {
  const scoped = readAll()[kind]?.[scopeKey];
  if (!Array.isArray(scoped)) return null;
  return scoped.filter((date) => typeof date === "string" && date.trim());
}

export function writePurchaseGroupExpanded(
  kind: PurchaseGroupListKind,
  scopeKey: string,
  expandedDates: string[],
): void {
  const all = readAll();
  const kindMap = { ...(all[kind] ?? {}) };
  kindMap[scopeKey] = expandedDates;
  writeAll({ ...all, [kind]: kindMap });
}

export function resolvePurchaseGroupExpanded(
  kind: PurchaseGroupListKind,
  scopeKey: string,
  groupDates: string[],
): Set<string> {
  const stored = readPurchaseGroupExpanded(kind, scopeKey);
  if (stored !== null) {
    const valid = stored.filter((date) => groupDates.includes(date));
    return new Set(valid);
  }

  const recent = pickMostRecentPaymentDate(groupDates);
  return recent ? new Set([recent]) : new Set();
}
