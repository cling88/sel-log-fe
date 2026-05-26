"use client";

import { useCallback, useState } from "react";

export function createTempId() {
  return `tmp-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
}

export type PendingInsert<T> = {
  tempId: string;
  afterId: string;
  draft: T;
};

export type DisplayItem<T> =
  | { type: "saved"; data: T }
  | { type: "pending"; tempId: string; afterId: string; draft: T };

export function buildDisplayList<T extends { id: string }>(
  rows: T[],
  pending: PendingInsert<T>[],
): DisplayItem<T>[] {
  const items: DisplayItem<T>[] = [];
  for (const row of rows) {
    items.push({ type: "saved", data: row });
    for (const insert of pending.filter((p) => p.afterId === row.id)) {
      items.push({
        type: "pending",
        tempId: insert.tempId,
        afterId: insert.afterId,
        draft: insert.draft,
      });
    }
  }
  return items;
}

export function insertAfterRow<T extends { id: string }>(
  rows: T[],
  afterId: string,
  newRow: T,
): T[] {
  const index = rows.findIndex((row) => row.id === afterId);
  if (index === -1) return [...rows, newRow];
  return [...rows.slice(0, index + 1), newRow, ...rows.slice(index + 1)];
}

export function useTableRowInsert<T extends { id: string }>(
  createEmpty: () => T,
) {
  const [pendingInserts, setPendingInserts] = useState<PendingInsert<T>[]>([]);
  const [registerDraft, setRegisterDraft] = useState<T>(createEmpty);

  const insertAfter = useCallback(
    (afterId: string) => {
      setPendingInserts((prev) => [
        ...prev,
        { tempId: createTempId(), afterId, draft: createEmpty() },
      ]);
    },
    [createEmpty],
  );

  const updatePending = useCallback(
    (tempId: string, updater: (draft: T) => T) => {
      setPendingInserts((prev) =>
        prev.map((item) =>
          item.tempId === tempId
            ? { ...item, draft: updater(item.draft) }
            : item,
        ),
      );
    },
    [],
  );

  const removePending = useCallback((tempId: string) => {
    setPendingInserts((prev) => prev.filter((item) => item.tempId !== tempId));
  }, []);

  const resetRegister = useCallback(() => {
    setRegisterDraft(createEmpty());
  }, [createEmpty]);

  const updateRegister = useCallback((updater: (draft: T) => T) => {
    setRegisterDraft((prev) => updater(prev));
  }, []);

  const buildList = useCallback(
    (rows: T[]) => buildDisplayList(rows, pendingInserts),
    [pendingInserts],
  );

  return {
    registerDraft,
    insertAfter,
    updatePending,
    removePending,
    resetRegister,
    updateRegister,
    buildList,
  };
}
