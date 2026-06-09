"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MODAL_DIALOG_FOOTER_CLASS } from "@/components/common/modal-footer-classes";
import type { InventoryCategory } from "@/types/inventory-category";

export interface CategoryManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: InventoryCategory[];
  selectedCategoryName?: string;
  loading?: boolean;
  loadError?: string | null;
  mutating?: boolean;
  onSelect: (name: string) => void | Promise<void>;
  onCreate: (name: string) => void | Promise<void>;
  onUpdate: (id: string, name: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export function CategoryManageDialog({
  open,
  onOpenChange,
  categories,
  selectedCategoryName,
  loading = false,
  loadError = null,
  mutating = false,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
}: CategoryManageDialogProps) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    if (!open) return;
    setNewName("");
    setEditingId(null);
    setEditingName("");
  }, [open]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    await onCreate(name);
    setNewName("");
  };

  const handleStartEdit = (cat: InventoryCategory) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const handleConfirmEdit = async () => {
    if (!editingId) return;
    const name = editingName.trim();
    if (!name) return;
    await onUpdate(editingId, name);
    setEditingId(null);
    setEditingName("");
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
    if (editingId === id) {
      setEditingId(null);
      setEditingName("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        nested
        className="flex max-h-[min(85vh,520px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        aria-describedby={undefined}
      >
        <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4">
          <DialogTitle>카테고리 선택</DialogTitle>
          <DialogDescription>
            선택/추가/수정/삭제를 할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-3">
            {loadError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {loadError}
              </p>
            ) : null}

            <div className="flex items-center gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="예: 포장재"
                disabled={loading || mutating}
              />
              <Button
                type="button"
                size="sm"
                className="h-9"
                disabled={loading || mutating}
                onClick={() => void handleCreate()}
              >
                + 추가
              </Button>
            </div>

            {loading ? (
              <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">
                카테고리 불러오는 중...
              </p>
            ) : categories.length === 0 ? (
              <p className="py-6 text-sm text-[var(--color-text-muted)]">
                아직 카테고리가 없습니다.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {categories.map((cat) => {
                  const isEditing = editingId === cat.id;
                  const isSelected = selectedCategoryName === cat.name;
                  return (
                    <li
                      key={cat.id}
                      className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        {isEditing ? (
                          <div className="flex flex-1 items-center gap-2">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              placeholder="카테고리명"
                            />
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 shrink-0"
                              onClick={() => void handleConfirmEdit()}
                            >
                              저장
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 shrink-0"
                              onClick={() => {
                                setEditingId(null);
                                setEditingName("");
                              }}
                            >
                              취소
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="min-w-0 flex flex-1 items-center gap-2">
                              <span className="truncate text-sm font-medium">
                                {cat.name}
                              </span>
                              {isSelected ? (
                                <span className="rounded-full bg-[var(--primary-50)] px-2 py-0.5 text-[10px] font-medium text-[var(--primary-600)]">
                                  선택됨
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Button
                                type="button"
                                size="sm"
                                className="h-8"
                                disabled={mutating}
                                onClick={() => void onSelect(cat.name)}
                              >
                                선택
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="h-8 w-8"
                                disabled={mutating}
                                onClick={() => handleStartEdit(cat)}
                                aria-label="카테고리 수정"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="h-8 w-8"
                                disabled={mutating}
                                onClick={() => void handleDelete(cat.id)}
                                aria-label="카테고리 삭제"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter className={MODAL_DIALOG_FOOTER_CLASS}>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
