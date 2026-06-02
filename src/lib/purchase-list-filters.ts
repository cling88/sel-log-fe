export const PURCHASE_GROUPS_PAGE_SIZE = 5;

export function filterBySearch<T extends { paymentDate: string }>(
  lines: T[],
  query: string,
  matchLine: (line: T, q: string) => boolean,
  groupMeta?: Record<string, { groupName: string }>,
): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return lines;
  return lines.filter((line) => {
    const groupName =
      groupMeta?.[line.paymentDate]?.groupName?.toLowerCase() ?? "";
    if (groupName.includes(q)) return true;
    if (line.paymentDate.includes(q)) return true;
    return matchLine(line, q);
  });
}

export function paginate<T>(items: T[], page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    totalPages,
    items: items.slice(start, start + pageSize),
  };
}
