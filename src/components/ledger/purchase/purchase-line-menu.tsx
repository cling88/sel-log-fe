"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

interface PurchaseLineMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  deleteDisabled?: boolean;
  deleteDisabledReason?: string;
}

export function PurchaseLineMenu({
  onEdit,
  onDelete,
  deleteDisabled,
  deleteDisabledReason,
}: PurchaseLineMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8 shrink-0"
            aria-label="더보기"
          />
        }
      >
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>수정</DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          disabled={deleteDisabled}
          title={deleteDisabled ? deleteDisabledReason : undefined}
          onClick={() => {
            if (deleteDisabled) return;
            onDelete();
          }}
        >
          삭제
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
