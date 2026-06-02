export interface PurchaseGroupAdjustment {
  id: string;
  label: string;
  amount: number;
}

export interface PurchaseGroupMeta {
  groupName: string;
  extraFees: PurchaseGroupAdjustment[];
  discounts: PurchaseGroupAdjustment[];
  orderCancelled: boolean;
}

export function newAdjustmentId(): string {
  return `adj-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
}

export function createEmptyAdjustment(): PurchaseGroupAdjustment {
  return {
    id: newAdjustmentId(),
    label: "",
    amount: 0,
  };
}

export function createDefaultGroupMeta(index: number): PurchaseGroupMeta {
  return {
    groupName: `매입${index + 1}`,
    extraFees: [],
    discounts: [],
    orderCancelled: false,
  };
}

export function sumAdjustmentAmounts(items: PurchaseGroupAdjustment[]): number {
  return items.reduce((sum, item) => sum + Math.max(0, item.amount), 0);
}

export function cloneGroupAdjustments(
  meta: Pick<PurchaseGroupMeta, "extraFees" | "discounts">,
): Pick<PurchaseGroupMeta, "extraFees" | "discounts"> {
  return {
    extraFees: meta.extraFees.map((item) => ({ ...item })),
    discounts: meta.discounts.map((item) => ({ ...item })),
  };
}

export function sanitizeAdjustments(
  items: PurchaseGroupAdjustment[],
): PurchaseGroupAdjustment[] {
  return items.filter((item) => item.amount > 0 || item.label.trim());
}

export function areGroupAdjustmentsDirty(
  saved: Pick<PurchaseGroupMeta, "extraFees" | "discounts">,
  draft: Pick<PurchaseGroupMeta, "extraFees" | "discounts">,
): boolean {
  const normalize = (items: PurchaseGroupAdjustment[]) =>
    sanitizeAdjustments(items).map((item) => ({
      id: item.id,
      label: item.label.trim(),
      amount: item.amount,
    }));

  return (
    JSON.stringify(normalize(saved.extraFees)) !==
      JSON.stringify(normalize(draft.extraFees)) ||
    JSON.stringify(normalize(saved.discounts)) !==
      JSON.stringify(normalize(draft.discounts))
  );
}
