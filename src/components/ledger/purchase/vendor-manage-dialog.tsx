"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { MODAL_DIALOG_FOOTER_CLASS } from "@/components/common/modal-footer-classes";
import { formatVendorLabel, isHttpUrl } from "@/lib/vendor-label";
import type { Vendor, VendorInput } from "@/types/vendor";

const EMPTY_INPUT: VendorInput = {
  name: "",
  link: "",
};

function isValidInput(input: VendorInput): boolean {
  const name = input.name.trim();
  if (!name) return false;
  const link = input.link?.trim() ?? "";
  if (link && !isHttpUrl(link)) return false;
  return true;
}

export interface VendorManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendors: Vendor[];
  selectedVendorId?: string | null;
  loading?: boolean;
  loadError?: string | null;
  mutating?: boolean;
  required?: boolean;
  onSelect: (id: string) => void | Promise<void>;
  onClear?: () => void | Promise<void>;
  onCreate: (body: VendorInput) => void | Promise<void>;
  onUpdate: (id: string, body: VendorInput) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export function VendorManageDialog({
  open,
  onOpenChange,
  vendors,
  selectedVendorId,
  loading = false,
  loadError = null,
  mutating = false,
  required = false,
  onSelect,
  onClear,
  onCreate,
  onUpdate,
  onDelete,
}: VendorManageDialogProps) {
  const [newInput, setNewInput] = useState<VendorInput>(EMPTY_INPUT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingInput, setEditingInput] = useState<VendorInput>(EMPTY_INPUT);

  useEffect(() => {
    if (!open) return;
    setNewInput(EMPTY_INPUT);
    setEditingId(null);
    setEditingInput(EMPTY_INPUT);
  }, [open]);

  const handleCreate = async () => {
    if (!isValidInput(newInput)) return;
    await onCreate({
      name: newInput.name.trim(),
      link: newInput.link?.trim() ?? "",
    });
    setNewInput(EMPTY_INPUT);
  };

  const handleStartEdit = (vendor: Vendor) => {
    setEditingId(vendor.id);
    setEditingInput({
      name: vendor.name,
      link: vendor.link,
    });
  };

  const handleConfirmEdit = async () => {
    if (!editingId || !isValidInput(editingInput)) return;
    await onUpdate(editingId, {
      name: editingInput.name.trim(),
      link: editingInput.link?.trim() ?? "",
    });
    setEditingId(null);
    setEditingInput(EMPTY_INPUT);
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
    if (editingId === id) {
      setEditingId(null);
      setEditingInput(EMPTY_INPUT);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        nested
        className="flex max-h-[min(85vh,560px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        aria-describedby={undefined}
      >
        <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4">
          <DialogTitle>구매처 선택</DialogTitle>
          <DialogDescription>
            구매처를 등록·선택합니다. 링크는 쇼핑몰·도매 사이트 URL을 넣을 수
            있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-4">
            {loadError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {loadError}
              </p>
            ) : null}

            <div className="space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/50 p-3">
              <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                구매처 추가
              </p>
              <div className="grid gap-2">
                <div className="space-y-1">
                  <Label htmlFor="vendor-new-name" className="text-xs">
                    구매처명 <span className="text-[var(--color-danger)]">*</span>
                  </Label>
                  <Input
                    id="vendor-new-name"
                    value={newInput.name}
                    onChange={(e) =>
                      setNewInput((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="도매몰A"
                    disabled={loading || mutating}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="vendor-new-link" className="text-xs">
                    링크 (선택)
                  </Label>
                  <Input
                    id="vendor-new-link"
                    value={newInput.link ?? ""}
                    onChange={(e) =>
                      setNewInput((prev) => ({ ...prev, link: e.target.value }))
                    }
                    placeholder="https://"
                    disabled={loading || mutating}
                  />
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                className="h-8"
                disabled={loading || mutating || !isValidInput(newInput)}
                onClick={() => void handleCreate()}
              >
                + 구매처 추가
              </Button>
            </div>

            {loading ? (
              <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">
                구매처 불러오는 중...
              </p>
            ) : vendors.length === 0 ? (
              <p className="py-4 text-sm text-[var(--color-text-muted)]">
                등록된 구매처가 없습니다. 위에서 추가해 주세요.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {vendors.map((vendor) => {
                  const isEditing = editingId === vendor.id;
                  const isSelected = selectedVendorId === vendor.id;
                  const link = vendor.link?.trim();
                  const hasLink = link && isHttpUrl(link);
                  return (
                    <li
                      key={vendor.id}
                      className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2"
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editingInput.name}
                            onChange={(e) =>
                              setEditingInput((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            placeholder="구매처명"
                          />
                          <Input
                            value={editingInput.link ?? ""}
                            onChange={(e) =>
                              setEditingInput((prev) => ({
                                ...prev,
                                link: e.target.value,
                              }))
                            }
                            placeholder="https://"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => {
                                setEditingId(null);
                                setEditingInput(EMPTY_INPUT);
                              }}
                            >
                              취소
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="h-8"
                              disabled={!isValidInput(editingInput)}
                              onClick={() => void handleConfirmEdit()}
                            >
                              저장
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                              {formatVendorLabel(vendor)}
                            </p>
                            {hasLink ? (
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-xs text-[var(--primary-600)] hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="size-3 shrink-0" />
                                <span className="truncate">{link}</span>
                              </a>
                            ) : null}
                            {isSelected ? (
                              <span className="mt-1 inline-flex rounded-full bg-[var(--primary-50)] px-2 py-0.5 text-[10px] font-medium text-[var(--primary-600)]">
                                선택됨
                              </span>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              className="h-8"
                              disabled={mutating}
                              onClick={() => void onSelect(vendor.id)}
                            >
                              선택
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="h-8 w-8"
                              disabled={mutating}
                              onClick={() => handleStartEdit(vendor)}
                              aria-label="구매처 수정"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="h-8 w-8"
                              disabled={mutating}
                              onClick={() => void handleDelete(vendor.id)}
                              aria-label="구매처 삭제"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter className={MODAL_DIALOG_FOOTER_CLASS}>
          {onClear && selectedVendorId && !required ? (
            <Button
              type="button"
              variant="ghost"
              className="mr-auto text-[var(--color-text-secondary)]"
              onClick={() => void onClear()}
            >
              선택 해제
            </Button>
          ) : (
            <span className="mr-auto" />
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
