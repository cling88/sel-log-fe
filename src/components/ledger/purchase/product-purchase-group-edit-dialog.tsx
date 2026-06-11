"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { REGISTER_MODAL_FOOTER_CLASS } from "@/components/ledger/purchase/ledger-register-dialog-classes";

interface ProductPurchaseGroupEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentDate: string;
  groupName: string;
  onSave: (data: { paymentDate: string; groupName: string }) => void | Promise<void>;
}

export function ProductPurchaseGroupEditDialog({
  open,
  onOpenChange,
  paymentDate,
  groupName,
  onSave,
}: ProductPurchaseGroupEditDialogProps) {
  const [date, setDate] = useState(paymentDate);
  const [name, setName] = useState(groupName);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDate(paymentDate);
    setName(groupName);
    setSubmitting(false);
  }, [open, paymentDate, groupName]);

  const submit = async () => {
    const trimmedDate = date.trim();
    const trimmedName = name.trim();
    if (!trimmedDate || !trimmedName || submitting) return;
    setSubmitting(true);
    try {
      await onSave({ paymentDate: trimmedDate, groupName: trimmedName });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-sm">
        <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4">
          <DialogTitle>그룹 수정</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-5 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="grp-date">결제날짜</Label>
            <Input
              id="grp-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="grp-name">그룹명</Label>
            <Input
              id="grp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className={REGISTER_MODAL_FOOTER_CLASS}>
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button type="button" disabled={submitting} onClick={() => void submit()}>
            {submitting ? "저장 중…" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
