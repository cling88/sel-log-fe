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
import { cn } from "@/lib/utils";
import type { SalesChannel } from "@/types/sale-channel";

export interface SaleChannelManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channels: SalesChannel[];
  selectedChannelId?: string | null;
  loading?: boolean;
  loadError?: string | null;
  mutating?: boolean;
  onSelect: (id: string) => void | Promise<void>;
  onClear?: () => void | Promise<void>;
  onCreate: (name: string) => void | Promise<void>;
  onUpdate: (id: string, name: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export function SaleChannelManageDialog({
  open,
  onOpenChange,
  channels,
  selectedChannelId,
  loading = false,
  loadError = null,
  mutating = false,
  onSelect,
  onClear,
  onCreate,
  onUpdate,
  onDelete,
}: SaleChannelManageDialogProps) {
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

  const handleStartEdit = (channel: SalesChannel) => {
    setEditingId(channel.id);
    setEditingName(channel.name);
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
        className="flex max-h-[min(85vh,520px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        aria-describedby={undefined}
      >
        <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4">
          <DialogTitle>판매채널 선택</DialogTitle>
          <DialogDescription>
            채널을 등록·선택합니다. 매출 등록 시 판매채널을 지정할 수 있습니다.
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
                placeholder="예: 스마트스토어"
                disabled={loading || mutating}
              />
              <Button
                type="button"
                size="sm"
                className="h-9 shrink-0"
                disabled={loading || mutating}
                onClick={() => void handleCreate()}
              >
                + 추가
              </Button>
            </div>

            {loading ? (
              <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">
                판매채널 불러오는 중...
              </p>
            ) : channels.length === 0 ? (
              <p className="py-6 text-sm text-[var(--color-text-muted)]">
                아직 판매채널이 없습니다. 위에서 추가해 주세요.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {channels.map((channel) => {
                  const isEditing = editingId === channel.id;
                  const isSelected = selectedChannelId === channel.id;
                  return (
                    <li
                      key={channel.id}
                      className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        {isEditing ? (
                          <div className="flex flex-1 items-center gap-2">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              placeholder="판매채널명"
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
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                              <span className="truncate text-sm font-medium">
                                {channel.name}
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
                                onClick={() => void onSelect(channel.id)}
                              >
                                선택
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="h-8 w-8"
                                disabled={mutating}
                                onClick={() => handleStartEdit(channel)}
                                aria-label="판매채널 수정"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="h-8 w-8"
                                disabled={mutating}
                                onClick={() => void handleDelete(channel.id)}
                                aria-label="판매채널 삭제"
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

        <DialogFooter
          className={cn(
            MODAL_DIALOG_FOOTER_CLASS,
            onClear && "sm:justify-between",
          )}
        >
          {onClear ? (
            <Button
              type="button"
              variant="outline"
              disabled={mutating}
              onClick={() => void onClear()}
            >
              선택 해제
            </Button>
          ) : (
            <span />
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
