"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  resolvePurchaseGroupExpanded,
  writePurchaseGroupExpanded,
  type PurchaseGroupListKind,
} from "@/lib/purchase-group-expanded-storage";

export function usePurchaseGroupExpanded(
  kind: PurchaseGroupListKind,
  scopeKey: string,
  groups: { paymentDate: string }[],
) {
  const groupDates = useMemo(
    () => groups.map((group) => group.paymentDate),
    [groups],
  );
  const groupDatesKey = groupDates.join("|");

  const [expandedDates, setExpandedDates] = useState<Set<string>>(() =>
    resolvePurchaseGroupExpanded(kind, scopeKey, groupDates),
  );

  useEffect(() => {
    setExpandedDates(resolvePurchaseGroupExpanded(kind, scopeKey, groupDates));
  }, [kind, scopeKey, groupDatesKey]);

  const toggle = useCallback(
    (paymentDate: string) => {
      setExpandedDates((prev) => {
        const next = new Set(prev);
        if (next.has(paymentDate)) next.delete(paymentDate);
        else next.add(paymentDate);
        writePurchaseGroupExpanded(kind, scopeKey, [...next]);
        return next;
      });
    },
    [kind, scopeKey],
  );

  const isExpanded = useCallback(
    (paymentDate: string) => expandedDates.has(paymentDate),
    [expandedDates],
  );

  return { isExpanded, toggle };
}
