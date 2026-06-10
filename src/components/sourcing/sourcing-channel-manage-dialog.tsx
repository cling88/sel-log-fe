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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MODAL_DIALOG_FOOTER_CLASS } from "@/components/common/modal-footer-classes";
import { SourcingExternalLink } from "@/components/sourcing/sourcing-external-link";
import { isHttpUrl } from "@/lib/vendor-label";
import type { SourcingChannel, SourcingChannelInput } from "@/types/sourcing";

const CHANNEL_MEMO_MAX = 2000;

const EMPTY_INPUT: SourcingChannelInput = { name: "", url: "", memo: "" };

function isValidInput(input: SourcingChannelInput): boolean {
  const name = input.name.trim();
  if (!name) return false;
  const url = input.url?.trim() ?? "";
  if (url && !isHttpUrl(url)) return false;
  return (input.memo?.length ?? 0) <= CHANNEL_MEMO_MAX;
}

export interface SourcingChannelManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channels: SourcingChannel[];
  selectedChannelId?: string | null;
  mutating?: boolean;
  productCountByChannelId?: (channelId: string) => number;
  onSelect: (id: string) => void | Promise<void>;
  onClear?: () => void | Promise<void>;
  onCreate: (body: SourcingChannelInput) => void | Promise<void>;
  onUpdate: (id: string, body: SourcingChannelInput) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export function SourcingChannelManageDialog({
  open,
  onOpenChange,
  channels,
  selectedChannelId,
  mutating = false,
  productCountByChannelId,
  onSelect,
  onClear,
  onCreate,
  onUpdate,
  onDelete,
}: SourcingChannelManageDialogProps) {
  const [newInput, setNewInput] = useState<SourcingChannelInput>(EMPTY_INPUT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingInput, setEditingInput] = useState<SourcingChannelInput>(
    EMPTY_INPUT,
  );

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
      url: newInput.url?.trim() ?? "",
      memo: newInput.memo?.trim() ?? "",
    });
    setNewInput(EMPTY_INPUT);
  };

  const handleStartEdit = (channel: SourcingChannel) => {
    setEditingId(channel.id);
    setEditingInput({
      name: channel.name,
      url: channel.url ?? "",
      memo: channel.memo,
    });
  };

  const handleConfirmEdit = async () => {
    if (!editingId || !isValidInput(editingInput)) return;
    await onUpdate(editingId, {
      name: editingInput.name.trim(),
      url: editingInput.url?.trim() ?? "",
      memo: editingInput.memo?.trim() ?? "",
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
          <DialogTitle>소싱 채널 선택</DialogTitle>
          <DialogDescription>
            소싱처를 등록·선택합니다. 상호명과 URL 조합이 같으면 중복 등록할 수
            없습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-4">
            <div className="relative rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/50 p-3">
              <p className="absolute top-3 right-3 text-xs font-bold text-[var(--color-text-secondary)]">
                채널 추가
              </p>
              <div className="grid gap-2">
                <div className="space-y-1 pr-16">
                  <Label htmlFor="sourcing-channel-new-name" className="text-xs">
                    상호명 <span className="text-[var(--color-danger)]">*</span>
                  </Label>
                  <Input
                    id="sourcing-channel-new-name"
                    value={newInput.name}
                    disabled={mutating}
                    onChange={(e) =>
                      setNewInput((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="도매몰A"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sourcing-channel-new-url" className="text-xs">
                    URL
                  </Label>
                  <Input
                    id="sourcing-channel-new-url"
                    value={newInput.url ?? ""}
                    disabled={mutating}
                    onChange={(e) =>
                      setNewInput((prev) => ({ ...prev, url: e.target.value }))
                    }
                    placeholder="https://"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="sourcing-channel-new-memo" className="text-xs">
                    메모
                  </Label>
                  <div className="flex items-start gap-2">
                    <Textarea
                      id="sourcing-channel-new-memo"
                      rows={2}
                      maxLength={CHANNEL_MEMO_MAX}
                      className="min-w-0 flex-1 resize-y"
                      value={newInput.memo ?? ""}
                      disabled={mutating}
                      onChange={(e) =>
                        setNewInput((prev) => ({ ...prev, memo: e.target.value }))
                      }
                      placeholder="연락처, MOQ, 배송 조건 등"
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="h-8 shrink-0 self-end"
                      disabled={mutating || !isValidInput(newInput)}
                      onClick={() => void handleCreate()}
                    >
                      + 채널 추가
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {channels.length === 0 ? (
              <p className="py-4 text-sm text-[var(--color-text-muted)]">
                등록된 소싱 채널이 없습니다. 위에서 추가해 주세요.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {channels.map((channel) => {
                  const isEditing = editingId === channel.id;
                  const isSelected = selectedChannelId === channel.id;
                  const productCount = productCountByChannelId?.(channel.id) ?? 0;

                  return (
                    <li
                      key={channel.id}
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
                            placeholder="상호명"
                          />
                          <Input
                            value={editingInput.url ?? ""}
                            onChange={(e) =>
                              setEditingInput((prev) => ({
                                ...prev,
                                url: e.target.value,
                              }))
                            }
                            placeholder="https://"
                          />
                          <Textarea
                            rows={2}
                            maxLength={CHANNEL_MEMO_MAX}
                            value={editingInput.memo ?? ""}
                            onChange={(e) =>
                              setEditingInput((prev) => ({
                                ...prev,
                                memo: e.target.value,
                              }))
                            }
                            placeholder="메모"
                            className="resize-y"
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
                              {channel.name}
                            </p>
                            <SourcingExternalLink
                              href={channel.url ?? ""}
                              className="mt-0.5"
                            />
                            {channel.memo ? (
                              <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-muted)]">
                                {channel.memo}
                              </p>
                            ) : null}
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {isSelected ? (
                                <span className="inline-flex rounded-full bg-[var(--primary-50)] px-2 py-0.5 text-[10px] font-medium text-[var(--primary-600)]">
                                  선택됨
                                </span>
                              ) : null}
                              {productCount > 0 ? (
                                <span className="inline-flex rounded-full bg-[var(--color-bg)] px-2 py-0.5 text-[10px] text-[var(--color-text-muted)]">
                                  제품 {productCount}건
                                </span>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
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
                              aria-label="채널 수정"
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
                              aria-label="채널 삭제"
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
          {onClear && selectedChannelId ? (
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
