"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface ManagedSelectOption {
  value: string;
  label: string;
  skuCode?: string;
}

interface ManagedSelectFieldProps {
  label: string;
  value: string;
  options: ManagedSelectOption[];
  onChange: (value: string) => void;
  allowEmpty?: boolean;
  emptyLabel?: string;
  /** 카테고리: SKU 1글자 코드 입력 */
  showSkuCodeOnAdd?: boolean;
  suggestedSkuCode?: string;
  onAdd: (payload: { label: string; skuCode?: string }) => void;
  onEdit?: (value: string, label: string, skuCode?: string) => void;
  onRemove?: (value: string) => void;
  canRemove?: (value: string) => boolean;
}

export function ManagedSelectField({
  label,
  value,
  options,
  onChange,
  allowEmpty = false,
  emptyLabel = "선택 안 함",
  showSkuCodeOnAdd = false,
  suggestedSkuCode = "",
  onAdd,
  onEdit,
  onRemove,
  canRemove,
}: ManagedSelectFieldProps) {
  const [panel, setPanel] = useState<"closed" | "add" | "edit">("closed");
  const [draftLabel, setDraftLabel] = useState("");
  const [draftSkuCode, setDraftSkuCode] = useState("");

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (panel === "closed") {
      setDraftLabel("");
      setDraftSkuCode("");
    }
  }, [panel]);

  const openAdd = () => {
    setDraftLabel("");
    setDraftSkuCode(suggestedSkuCode);
    setPanel("add");
  };

  const openEdit = () => {
    if (!selected) return;
    setDraftLabel(selected.label);
    setDraftSkuCode(selected.skuCode ?? "");
    setPanel("edit");
  };

  const handleSaveAdd = () => {
    try {
      onAdd({
        label: draftLabel,
        skuCode: showSkuCodeOnAdd ? draftSkuCode : undefined,
      });
      setPanel("closed");
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "저장에 실패했습니다.");
    }
  };

  const handleSaveEdit = () => {
    if (!value || !onEdit) return;
    try {
      onEdit(value, draftLabel, showSkuCodeOnAdd ? draftSkuCode : undefined);
      setPanel("closed");
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "수정에 실패했습니다.");
    }
  };

  const handleRemove = () => {
    if (!value || !onRemove) return;
    if (canRemove && !canRemove(value)) {
      window.alert("사용 중인 항목은 삭제할 수 없습니다.");
      return;
    }
    if (!window.confirm("삭제할까요?")) return;
    onRemove(value);
    onChange("");
    setPanel("closed");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-zinc-600">{label}</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={openAdd}
            className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
          >
            + 추가
          </button>
          {selected && onEdit ? (
            <button
              type="button"
              onClick={openEdit}
              className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
            >
              수정
            </button>
          ) : null}
        </div>
      </div>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-zinc-200 px-2 text-sm outline-none focus:border-zinc-400"
      >
        {allowEmpty ? <option value="">{emptyLabel}</option> : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {panel !== "closed" ? (
        <div
          className={cn(
            "rounded-lg border p-3 text-sm",
            panel === "add"
              ? "border-blue-100 bg-blue-50/50"
              : "border-amber-100 bg-amber-50/50",
          )}
        >
          <p className="font-medium text-zinc-800">
            {panel === "add" ? `${label} 추가` : `${label} 수정`}
          </p>
          <label className="mt-2 block">
            <span className="text-xs text-zinc-500">이름</span>
            <input
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              className="mt-1 h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-sm"
            />
          </label>
          {showSkuCodeOnAdd ? (
            <label className="mt-2 block">
              <span className="text-xs text-zinc-500">
                SKU 코드 (1글자)
                {panel === "edit" ? " · 등록 후 변경 시 기존 SKU 형식과 달라질 수 있음" : ""}
              </span>
              <input
                value={draftSkuCode}
                onChange={(e) =>
                  setDraftSkuCode(e.target.value.toUpperCase().slice(0, 1))
                }
                maxLength={1}
                placeholder={suggestedSkuCode || "G"}
                className="mt-1 h-8 w-16 rounded-md border border-zinc-200 bg-white px-2 font-mono text-sm"
              />
            </label>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={panel === "add" ? handleSaveAdd : handleSaveEdit}
              className="rounded-md bg-zinc-900 px-2.5 py-1 text-xs text-white hover:bg-zinc-800"
            >
              {panel === "add" ? "추가" : "저장"}
            </button>
            <button
              type="button"
              onClick={() => setPanel("closed")}
              className="rounded-md px-2.5 py-1 text-xs text-zinc-600 hover:bg-white/80"
            >
              취소
            </button>
            {panel === "edit" && onRemove ? (
              <button
                type="button"
                onClick={handleRemove}
                className="ml-auto rounded-md px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                삭제
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
