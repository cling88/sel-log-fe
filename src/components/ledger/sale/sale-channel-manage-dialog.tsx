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
import {
  feeRateToPercentInput,
  formatFeeRatePercent,
  isHttpUrl,
  percentInputToFeeRate,
} from "@/lib/fee-rate";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PLATFORM_FEE_RATE,
  type SalesChannel,
  type SalesChannelInput,
} from "@/types/sale-channel";

type ChannelFormState = {
  name: string;
  platformFeePercent: string;
  storeName: string;
  storeUrl: string;
};

const EMPTY_FORM: ChannelFormState = {
  name: "",
  platformFeePercent: feeRateToPercentInput(DEFAULT_PLATFORM_FEE_RATE),
  storeName: "",
  storeUrl: "",
};

function channelToForm(channel: SalesChannel): ChannelFormState {
  return {
    name: channel.name,
    platformFeePercent: feeRateToPercentInput(channel.platformFeeRate),
    storeName: channel.storeName ?? "",
    storeUrl: channel.storeUrl ?? "",
  };
}

function formToInput(form: ChannelFormState): SalesChannelInput | null {
  const name = form.name.trim();
  if (!name) return null;
  const platformFeeRate =
    percentInputToFeeRate(form.platformFeePercent) ?? DEFAULT_PLATFORM_FEE_RATE;
  const storeUrl = form.storeUrl.trim();
  if (storeUrl && !isHttpUrl(storeUrl)) return null;
  return {
    name,
    platformFeeRate,
    storeName: form.storeName.trim() || null,
    storeUrl: storeUrl || null,
  };
}

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
  onCreate: (body: SalesChannelInput) => void | Promise<void>;
  onUpdate: (id: string, body: SalesChannelInput) => void | Promise<void>;
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
  const [newForm, setNewForm] = useState<ChannelFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<ChannelFormState>(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    setNewForm(EMPTY_FORM);
    setEditingId(null);
    setEditingForm(EMPTY_FORM);
  }, [open]);

  const handleCreate = async () => {
    const body = formToInput(newForm);
    if (!body) return;
    await onCreate(body);
    setNewForm(EMPTY_FORM);
  };

  const handleStartEdit = (channel: SalesChannel) => {
    setEditingId(channel.id);
    setEditingForm(channelToForm(channel));
  };

  const handleConfirmEdit = async () => {
    if (!editingId) return;
    const body = formToInput(editingForm);
    if (!body) return;
    await onUpdate(editingId, body);
    setEditingId(null);
    setEditingForm(EMPTY_FORM);
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
    if (editingId === id) {
      setEditingId(null);
      setEditingForm(EMPTY_FORM);
    }
  };

  const renderFormFields = (
    form: ChannelFormState,
    onChange: (next: ChannelFormState) => void,
    idPrefix: string,
  ) => (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-name`}>채널명</Label>
        <Input
          id={`${idPrefix}-name`}
          value={form.name}
          onChange={(e) => onChange({ ...form, name: e.target.value })}
          placeholder="예: 스마트스토어"
          disabled={mutating}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-fee`}>적용 수수료 (%)</Label>
        <Input
          id={`${idPrefix}-fee`}
          value={form.platformFeePercent}
          onChange={(e) =>
            onChange({ ...form, platformFeePercent: e.target.value })
          }
          placeholder="6.36"
          inputMode="decimal"
          disabled={mutating}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-store`}>상점명</Label>
        <Input
          id={`${idPrefix}-store`}
          value={form.storeName}
          onChange={(e) => onChange({ ...form, storeName: e.target.value })}
          placeholder="선택"
          disabled={mutating}
        />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-url`}>스토어 URL</Label>
        <Input
          id={`${idPrefix}-url`}
          value={form.storeUrl}
          onChange={(e) => onChange({ ...form, storeUrl: e.target.value })}
          placeholder="https://..."
          disabled={mutating}
        />
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        nested
        className="flex max-h-[min(85vh,620px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        aria-describedby={undefined}
      >
        <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4">
          <DialogTitle>판매채널 선택</DialogTitle>
          <DialogDescription>
            채널별 수수료·상점 정보를 등록합니다. 추정 순익 계산에 수수료가
            반영됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-4">
            {loadError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {loadError}
              </p>
            ) : null}

            <div className="space-y-3 rounded-lg border border-dashed border-[var(--color-border)] p-3">
              <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                새 채널
              </p>
              {renderFormFields(newForm, setNewForm, "new")}
              <Button
                type="button"
                size="sm"
                className="h-8"
                disabled={loading || mutating || !formToInput(newForm)}
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
              <p className="py-4 text-sm text-[var(--color-text-muted)]">
                등록된 채널이 없습니다.
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
                      {isEditing ? (
                        <div className="space-y-2">
                          {renderFormFields(editingForm, setEditingForm, `edit-${channel.id}`)}
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              className="h-8"
                              disabled={!formToInput(editingForm)}
                              onClick={() => void handleConfirmEdit()}
                            >
                              저장
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => {
                                setEditingId(null);
                                setEditingForm(EMPTY_FORM);
                              }}
                            >
                              취소
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-sm font-medium">
                                {channel.name}
                              </span>
                              <span className="text-xs text-[var(--color-text-muted)]">
                                {formatFeeRatePercent(channel.platformFeeRate)}
                              </span>
                              {isSelected ? (
                                <span className="rounded-full bg-[var(--primary-50)] px-2 py-0.5 text-[10px] font-medium text-[var(--primary-600)]">
                                  선택됨
                                </span>
                              ) : null}
                            </div>
                            {channel.storeName ? (
                              <p className="mt-0.5 truncate text-xs text-[var(--color-text-secondary)]">
                                {channel.storeName}
                              </p>
                            ) : null}
                            {channel.storeUrl && isHttpUrl(channel.storeUrl) ? (
                              <a
                                href={channel.storeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1 inline-flex items-center gap-1 text-xs text-[var(--primary-600)] hover:underline"
                              >
                                스토어
                                <ExternalLink className="size-3" />
                              </a>
                            ) : null}
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
                        </div>
                      )}
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
