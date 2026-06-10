export type SourcingPriceEditMode = "auto" | "manual";

/** 빈 문자열 = 미입력 (입력란 비움, placeholder만 표시) */
export type MoneyField = number | "";

export type SourcingPriceFields = {
  quantity: number;
  totalPrice: MoneyField;
  unitPrice: MoneyField;
};

function safeQuantity(value: number): number {
  return Math.max(1, Math.floor(Number(value) || 0));
}

function safeMoney(value: number): number {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function moneyOrZero(value: MoneyField): number {
  if (value === "") return 0;
  return safeMoney(value);
}

/** 입력란 표시값 — 0·미입력은 빈 칸 + placeholder */
export function formatMoneyInputValue(value: MoneyField): string {
  if (value === "" || value === 0) return "";
  return String(value);
}

export function deriveUnitFromTotal(
  totalPrice: MoneyField,
  quantity: number,
): MoneyField {
  if (totalPrice === "") return "";
  const q = safeQuantity(quantity);
  const unit = Math.floor(moneyOrZero(totalPrice) / q);
  return unit === 0 ? "" : unit;
}

export function deriveTotalFromUnit(
  unitPrice: MoneyField,
  quantity: number,
): MoneyField {
  if (unitPrice === "") return "";
  const q = safeQuantity(quantity);
  const total = moneyOrZero(unitPrice) * q;
  return total === 0 ? "" : total;
}

/**
 * - auto: 최소주문수량·총 금액 변경 시 개별 단가 자동 계산
 * - manual: 사용자가 개별 단가를 직접 수정한 뒤 — 자동 계산 중단
 */
export function syncSourcingPriceFields(
  prev: SourcingPriceFields,
  edit: {
    field: "quantity" | "totalPrice" | "unitPrice";
    value: number | "";
  },
  mode: SourcingPriceEditMode,
): { fields: SourcingPriceFields; mode: SourcingPriceEditMode } {
  if (edit.field === "unitPrice") {
    if (edit.value === "") {
      return {
        mode: "manual",
        fields: { ...prev, unitPrice: "" },
      };
    }
    const unitPrice = safeMoney(edit.value);
    return {
      mode: "manual",
      fields: {
        ...prev,
        unitPrice: unitPrice === 0 ? "" : unitPrice,
      },
    };
  }

  if (edit.field === "totalPrice") {
    if (edit.value === "") {
      return {
        mode,
        fields: {
          ...prev,
          totalPrice: "",
          unitPrice: mode === "auto" ? "" : prev.unitPrice,
        },
      };
    }
    const totalPrice = safeMoney(edit.value);
    const quantity = safeQuantity(prev.quantity);
    const normalizedTotal: MoneyField = totalPrice === 0 ? "" : totalPrice;
    return {
      mode,
      fields: {
        quantity,
        totalPrice: normalizedTotal,
        unitPrice:
          mode === "auto"
            ? deriveUnitFromTotal(normalizedTotal, quantity)
            : prev.unitPrice,
      },
    };
  }

  const quantity = safeQuantity(
    typeof edit.value === "number" ? edit.value : prev.quantity,
  );
  return {
    mode,
    fields: {
      quantity,
      totalPrice: prev.totalPrice,
      unitPrice:
        mode === "auto"
          ? deriveUnitFromTotal(prev.totalPrice, quantity)
          : prev.unitPrice,
    },
  };
}
