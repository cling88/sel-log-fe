"use client";

import { useEffect, useState } from "react";
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

interface SourcingChannelFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editChannel?: SourcingChannel | null;
  saving?: boolean;
  onSave: (input: SourcingChannelInput) => void | Promise<void>;
}

export function SourcingChannelFormDialog({
  open,
  onOpenChange,
  editChannel,
  saving = false,
  onSave,
}: SourcingChannelFormDialogProps) {
  const isEdit = !!editChannel;
  const [form, setForm] = useState<SourcingChannelInput>(EMPTY_INPUT);

  useEffect(() => {
    if (!open) return;
    if (editChannel) {
      setForm({
        name: editChannel.name,
        url: editChannel.url ?? "",
        memo: editChannel.memo,
      });
      return;
    }
    setForm(EMPTY_INPUT);
  }, [open, editChannel]);

  const submit = async () => {
    if (!isValidInput(form)) return;
    try {
      await onSave({
        name: form.name.trim(),
        url: form.url?.trim() ?? "",
        memo: form.memo?.trim() ?? "",
      });
      onOpenChange(false);
    } catch {
      // 오류 alert는 호출측에서 처리
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4">
          <DialogTitle>{isEdit ? "소싱 채널 수정" : "소싱 채널 등록"}</DialogTitle>
          <DialogDescription>
            상호명과 URL 조합이 같으면 중복 등록할 수 없습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-5 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="sourcing-channel-name">
              상호명 <span className="text-[var(--color-danger)]">*</span>
            </Label>
            <Input
              id="sourcing-channel-name"
              value={form.name}
              disabled={saving}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="도매몰A"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sourcing-channel-url">URL</Label>
            <Input
              id="sourcing-channel-url"
              value={form.url ?? ""}
              disabled={saving}
              onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
              placeholder="https://"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sourcing-channel-memo">메모</Label>
            <Textarea
              id="sourcing-channel-memo"
              rows={3}
              maxLength={CHANNEL_MEMO_MAX}
              value={form.memo ?? ""}
              disabled={saving}
              onChange={(e) => setForm((prev) => ({ ...prev, memo: e.target.value }))}
              placeholder="연락처, MOQ, 배송 조건 등"
              className="resize-y"
            />
          </div>
        </div>

        <DialogFooter className={MODAL_DIALOG_FOOTER_CLASS}>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button
            type="button"
            disabled={saving || !isValidInput(form)}
            onClick={() => void submit()}
          >
            {saving ? "저장 중..." : isEdit ? "저장" : "등록"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
